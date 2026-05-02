import sys
import io
import tempfile
import os
import subprocess
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pygdbmi.gdbcontroller import GdbController
import json

# --- KHỞI TẠO FASTAPI ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODEL DỮ LIỆU ---
class CodeRequest(BaseModel):
    language: str
    code: str

# --- LOGIC XỬ LÝ PYTHON ---
def trace_python(code: str):
    if "input(" in code:
        return {"trace": [], "output": "", "error": "Hệ thống chưa hỗ trợ lệnh nhập dữ liệu (input). Vui lòng gán giá trị cứng."}

    with tempfile.TemporaryDirectory() as temp_dir:

        user_code_path = os.path.join(temp_dir, "main.py")
        with open(user_code_path, "w", encoding="utf-8") as f:
            f.write(code)

        tracer_script = """
import sys
import io
import json
import traceback

trace_log = []
output_buffer = io.StringIO()
error_msg = None

def trace_calls(frame, event, arg):
    # Chỉ bắt biến trong file main.py (code của user)
    if event == 'line' and frame.f_code.co_filename == 'main.py':
        locals_copy = {}
        for k, v in frame.f_locals.items():
            # Lọc bỏ rác hệ thống và hàm/module
            if not k.startswith('__') and not isinstance(v, type) and not str(type(v)).startswith("<class 'function'>") and not str(type(v)).startswith("<class 'module'>"):
                if isinstance(v, (int, float, str, bool)):
                    locals_copy[k] = {"type": "prim", "val": repr(v)}
                elif isinstance(v, (list, tuple)):
                    locals_copy[k] = {"type": "list", "val": [repr(x) for x in v]}
                elif isinstance(v, dict):
                    locals_copy[k] = {"type": "dict", "val": {str(dk): repr(dv) for dk, dv in v.items()}}
                elif hasattr(v, '__dict__'):
                    attrs = {str(ak): repr(av) for ak, av in v.__dict__.items() if not str(ak).startswith('__')}
                    locals_copy[k] = {"type": "object", "class_name": v.__class__.__name__, "val": attrs}
                else:
                    locals_copy[k] = {"type": "prim", "val": repr(v)}

        trace_log.append({
            "line": frame.f_lineno,
            "vars": locals_copy
        })
    return trace_calls

# Hướng toàn bộ lệnh print() vào bộ nhớ đệm
old_stdout = sys.stdout
sys.stdout = output_buffer

try:
    with open("main.py", "r", encoding="utf-8") as f:
        user_code = f.read()
    
    compiled_code = compile(user_code, 'main.py', 'exec')
    
    # Bật máy dò
    sys.settrace(trace_calls)
    exec(compiled_code, {"__name__": "__main__", "__file__": "main.py"})
except Exception as e:
    # Bắt lỗi cú pháp hoặc lỗi runtime của Python
    error_msg = traceback.format_exc().splitlines()[-1]
finally:
    sys.settrace(None)
    sys.stdout = old_stdout

# Lưu kết quả ra file để Server chính đọc
with open("trace.json", "w", encoding="utf-8") as f:
    json.dump(trace_log, f)

with open("output.txt", "w", encoding="utf-8") as f:
    f.write(output_buffer.getvalue())

if error_msg:
    with open("error.txt", "w", encoding="utf-8") as f:
        f.write(error_msg)
"""
        tracer_path = os.path.join(temp_dir, "tracer.py")
        with open(tracer_path, "w", encoding="utf-8") as f:
            f.write(tracer_script)

        try:
            python_exe = "python" if os.name == 'nt' else "python3"
            subprocess.run(
                [python_exe, "tracer.py"],
                cwd=temp_dir,
                timeout=3, 
                capture_output=True, text=True
            )
        except subprocess.TimeoutExpired:
            return {"trace": [], "output": "", "error": "Chương trình Python bị kẹt vòng lặp vô hạn hoặc chạy quá 3 giây."}

        trace_result = []
        output_result = ""
        error_result = None

        json_path = os.path.join(temp_dir, "trace.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                try: trace_result = json.load(f)
                except: pass

        output_txt_path = os.path.join(temp_dir, "output.txt")
        if os.path.exists(output_txt_path):
            with open(output_txt_path, "r", encoding="utf-8") as f:
                output_result = f.read()
                
        error_txt_path = os.path.join(temp_dir, "error.txt")
        if os.path.exists(error_txt_path):
            with open(error_txt_path, "r", encoding="utf-8") as f:
                error_result = f.read()

        return {
            "trace": trace_result,
            "output": output_result,
            "error": error_result
        }

# --- LOGIC XỬ LÝ C++ ---
def trace_cpp(code: str):
    if "cin" in code or "scanf" in code:
        return {"trace": [], "output": "", "error": "Hệ thống chưa hỗ trợ nhập dữ liệu (cin, scanf)."}

    with tempfile.TemporaryDirectory() as temp_dir:

        exe_name = "main.exe" if os.name == 'nt' else "main.out"
        cpp_name = "main.cpp"
        
        cpp_path = os.path.join(temp_dir, cpp_name)
        
        with open(cpp_path, "w", encoding="utf-8") as f:
            f.write(code)

        compile_process = subprocess.run(
            ["g++", "-g", "-O0", cpp_name, "-o", exe_name],
            cwd=temp_dir,
            capture_output=True, text=True
        )
        
        if compile_process.returncode != 0:
            return {"trace": [], "output": "", "error": "Lỗi biên dịch:\n" + compile_process.stderr}

        gdb_script = """
import gdb
import json

trace_log = []

try:
    gdb.execute("set pagination off")
    gdb.execute("break main")
    
    # Chạy và đẩy output của C++ ra file riêng (né rác console của GDB)
    gdb.execute("run > output.txt")

    while True:
        frame = gdb.selected_frame()
        if not frame: break
            
        sal = frame.find_sal()
        if not sal or not sal.symtab: break
            
        filename = sal.symtab.filename
        
        # Chỉ gom biến nếu đang ở trong main.cpp
        if "main.cpp" not in filename:
            try:
                gdb.execute("finish")
                continue
            except:
                break
                
        line_no = sal.line
        locals_dict = {}
        
        # Lấy biến cực kỳ an toàn qua API của GDB
        try:
            block = frame.block()
            while block and not block.is_global and not block.is_static:
                for symbol in block:
                    if symbol.is_variable or symbol.is_argument:
                        if not symbol.name.startswith("_"):
                            try:
                                val = str(frame.read_var(symbol))
                                # Format nhẹ để Frontend dễ vẽ
                                if "{" in val and "}" in val:
                                    fmt_val = val
                                else:
                                    fmt_val = val.split(" ")[0]
                                locals_dict[symbol.name] = {"type": "prim", "val": fmt_val}
                            except:
                                pass
                block = block.superblock
        except:
            pass

        trace_log.append({
            "line": line_no,
            "vars": locals_dict
        })
        
        gdb.execute("next")
        
except Exception as e:
    pass # Kết thúc chương trình 

# Lưu toàn bộ lịch sử thành file JSON
with open("trace.json", "w") as f:
    json.dump(trace_log, f)
"""
        script_path = os.path.join(temp_dir, "gdb_script.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(gdb_script)

        try:
            gdb_process = subprocess.run(
                ["gdb", "--batch", "-x", "gdb_script.py", exe_name],
                cwd=temp_dir,
                timeout=5,  
                capture_output=True, text=True
            )
        except subprocess.TimeoutExpired:
            return {"trace": [], "output": "", "error": "Chương trình C++ kẹt vòng lặp hoặc chạy quá lâu."}

        if "Python scripting is not supported" in gdb_process.stderr:
             return {"trace": [], "output": "", "error": "Bản MinGW/GDB hiện tại của bạn không hỗ trợ Python API. Vui lòng cập nhật MinGW-w64 bản mới nhất."}

        trace_result = []
        output_result = ""
        
        json_path = os.path.join(temp_dir, "trace.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                try: trace_result = json.load(f)
                except: pass
                
        output_txt_path = os.path.join(temp_dir, "output.txt")
        if os.path.exists(output_txt_path):
            with open(output_txt_path, "r", encoding="utf-8") as f:
                output_result = f.read()

        if not trace_result:
            error_msg = "Không thu thập được dữ liệu. Code có thể không chứa khai báo biến, hoặc GDB bị lỗi nội bộ.\n" + gdb_process.stderr
        else:
            error_msg = None

        return {
            "trace": trace_result,
            "output": output_result.replace("\\n", "\n"),
            "error": error_msg
        }

# --- API ENDPOINT ---
@app.post("/api/visualize")
async def visualize_code(req: CodeRequest):
    if req.language == "python":
        return trace_python(req.code)
    elif req.language == "cpp":
        return trace_cpp(req.code)
    else:
        return {"error": "Ngôn ngữ không được hỗ trợ", "trace": [], "output": ""}