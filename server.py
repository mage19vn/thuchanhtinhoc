import sys
import io
import tempfile
import os
import subprocess
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- KHỞI TẠO FASTAPI ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODEL DỮ LIỆU CẬP NHẬT ---
class CodeRequest(BaseModel):
    language: str
    code: str
    inputs: str = ""  # Thêm trường inputs (mặc định rỗng)

# --- LOGIC XỬ LÝ PYTHON ---
def trace_python(code: str, inputs: str):
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
    if event in ('line', 'return') and frame.f_code.co_filename == 'main.py':
        locals_copy = {}
        for k, v in frame.f_locals.items():
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

        # Lấy tên hàm hiện tại
        func_name = frame.f_code.co_name
        if func_name == '<module>':
            func_name = 'Global (Main)'

        trace_log.append({
            "line": frame.f_lineno,
            "func_name": func_name,
            "vars": locals_copy
        })
    return trace_calls

old_stdout = sys.stdout
sys.stdout = output_buffer

try:
    with open("main.py", "r", encoding="utf-8") as f:
        user_code = f.read()
    
    compiled_code = compile(user_code, 'main.py', 'exec')
    
    sys.settrace(trace_calls)
    exec(compiled_code, {"__name__": "__main__", "__file__": "main.py"})
except EOFError:
    # Bắt lỗi khi code đòi input() nhưng user không truyền đủ dữ liệu
    error_msg = "Lỗi: Chương trình yêu cầu nhập dữ liệu (input) nhưng bạn chưa cung cấp đủ đầu vào."
except Exception as e:
    error_msg = traceback.format_exc().splitlines()[-1]
    tb = traceback.extract_tb(e.__traceback__)
    error_line = -1
    for frame in reversed(tb):
        if frame.filename == "main.py":
            error_line = frame.lineno
            break
    with open("error_line.txt", "w", encoding="utf-8") as f:
        f.write(str(error_line))
finally:
    sys.settrace(None)
    sys.stdout = old_stdout

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
                input=inputs, # TRUYỀN LUỒNG INPUT VÀO ĐÂY
                timeout=3, 
                capture_output=True, text=True
            )
        except subprocess.TimeoutExpired:
            return {"trace": [], "output": "", "error": "Chương trình Python kẹt vòng lặp vô hạn hoặc chờ input quá lâu."}

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

        error_line_result = -1
        err_line_path = os.path.join(temp_dir, "error_line.txt")
        if os.path.exists(err_line_path):
            with open(err_line_path, "r", encoding="utf-8") as f:
                try: error_line_result = int(f.read().strip())
                except: pass

        return {
            "trace": trace_result,
            "output": output_result,
            "error": error_result,
            "error_line": error_line_result 
        }

# --- LOGIC XỬ LÝ C++ ---
def trace_cpp(code: str, inputs: str):
    import tempfile
    import os
    import subprocess
    import json

    with tempfile.TemporaryDirectory() as temp_dir:
        exe_name = "main.exe" if os.name == 'nt' else "main.out"
        cpp_name = "main.cpp"
        
        cpp_path = os.path.join(temp_dir, cpp_name)
        with open(cpp_path, "w", encoding="utf-8") as f:
            f.write(code)

        # LƯU CHUỖI INPUT VÀO FILE
        input_path = os.path.join(temp_dir, "input.txt")
        with open(input_path, "w", encoding="utf-8") as f:
            f.write(inputs)

        # Biên dịch C++
        compile_process = subprocess.run(
            ["g++", "-g", "-O0", cpp_name, "-o", exe_name],
            cwd=temp_dir,
            capture_output=True, text=True
        )
        
        if compile_process.returncode != 0:
            import re
            err_line = -1
            match = re.search(r'main\.cpp:(\d+):', compile_process.stderr)
            if match:
                err_line = int(match.group(1))
            return {"trace": [], "output": "", "error": "Lỗi biên dịch:\n" + compile_process.stderr, "error_line": err_line}

        # KỊCH BẢN GDB PYTHON (TỐI ƯU HÓA TỐC ĐỘ VÀ BẮT GLOBAL VARS)
        gdb_script = """
import gdb
import json
import re

trace_log = []

# HÀM PHỤ: Lấy danh sách tên các biến Global được khai báo trong main.cpp
def get_user_global_vars():
    globals_list = []
    try:
        out = gdb.execute("info variables", to_string=True)
        lines = out.split("\\n")
        
        is_in_main = False
        for line in lines:
            line = line.strip()
            if not line: continue
            
            if line.startswith("File main.cpp:"):
                is_in_main = True
                continue
            elif line.startswith("File "):
                is_in_main = False
                continue
                
            if is_in_main and line:
                # Regex bắt cả biến thường và mảng (ví dụ: int arr[100];)
                match = re.search(r'\\b([A-Za-z_][A-Za-z0-9_]*)(?:\\[.*?\\])?\\s*;', line)
                if match:
                    var_name = match.group(1)
                    if not var_name.startswith("_") and "@" not in var_name:
                        globals_list.append(var_name)
    except Exception as e:
        pass
    return globals_list

try:
    gdb.execute("set pagination off")
    gdb.execute("break main")
    gdb.execute("run < input.txt > output.txt")

    # Chỉ quét biến Global 1 lần đầu tiên cho nhẹ hệ thống
    user_globals = get_user_global_vars()

    while True:
        frame = gdb.selected_frame()
        if not frame: break
            
        sal = frame.find_sal()
        if not sal or not sal.symtab: break
            
        filename = sal.symtab.filename
        
        if "main.cpp" not in filename:
            try:
                gdb.execute("finish")
                continue
            except:
                break
                
        line_no = sal.line
        locals_dict = {}
        
        # --- BƯỚC 1: ĐỌC BIẾN GLOBAL ---
        for g_name in user_globals:
            try:
                val_str = str(gdb.parse_and_eval(g_name))
                if "{" in val_str and "}" in val_str:
                    fmt_val = val_str
                else:
                    fmt_val = val_str.split(" ")[0]
                
                # Thêm prefix [Global] để UI hiển thị khác biệt
                locals_dict[f"[Global] {g_name}"] = {"type": "prim", "val": fmt_val}
            except:
                pass
        
        # --- BƯỚC 2: ĐỌC BIẾN CỤC BỘ ---
        try:
            block = frame.block()
            while block and not block.is_global and not block.is_static:
                for symbol in block:
                    if symbol.is_variable or symbol.is_argument:
                        if not symbol.name.startswith("_"):
                            try:
                                val = str(frame.read_var(symbol))
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

        # Lấy tên hàm từ GDB frame
        func_name = frame.name()
        if not func_name: 
            func_name = "main"

        trace_log.append({
            "line": line_no,
            "func_name": func_name,
            "vars": locals_dict
        })
        
        # Dùng step để cho phép chui vào các hàm con do người dùng định nghĩa
        gdb.execute("step")
        
except Exception as e:
    pass 

with open("trace.json", "w") as f:
    json.dump(trace_log, f)
"""
        script_path = os.path.join(temp_dir, "gdb_script.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(gdb_script)

        # Chạy GDB ngầm với Timeout 5s
        try:
            gdb_process = subprocess.run(
                ["gdb", "--batch", "-x", "gdb_script.py", exe_name],
                cwd=temp_dir,
                timeout=5,  
                capture_output=True, text=True
            )
        except subprocess.TimeoutExpired:
            return {"trace": [], "output": "", "error": "Chương trình C++ kẹt vòng lặp hoặc chờ nhập dữ liệu quá lâu."}

        if "Python scripting is not supported" in gdb_process.stderr:
             return {"trace": [], "output": "", "error": "Bản MinGW/GDB hiện tại không hỗ trợ Python API."}

        trace_result = []
        output_result = ""
        
        # Đọc lại Trace Log
        json_path = os.path.join(temp_dir, "trace.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                try: trace_result = json.load(f)
                except: pass
                
        # Đọc lại Standard Output
        output_txt_path = os.path.join(temp_dir, "output.txt")
        if os.path.exists(output_txt_path):
            with open(output_txt_path, "r", encoding="utf-8") as f:
                output_result = f.read()

        if not trace_result:
            error_msg = "Không thu thập được dữ liệu. Code có thể lỗi hoặc chưa gán đủ input.\n" + gdb_process.stderr
        else:
            error_msg = None

        return {
            "trace": trace_result,
            "output": output_result.replace("\\n", "\n"),
            "error": error_msg,
            "error_line": -1 
        }

# --- API ENDPOINT ---
@app.post("/api/visualize")
async def visualize_code(req: CodeRequest):
    # Lấy cả code và inputs từ request
    if req.language == "python":
        return trace_python(req.code, req.inputs)
    elif req.language == "cpp":
        return trace_cpp(req.code, req.inputs)
    else:
        return {"error": "Ngôn ngữ không được hỗ trợ", "trace": [], "output": ""}
    
# --- API ĐỌC BÀI MẪU TỰ ĐỘNG ---
@app.get("/api/examples")
async def get_examples():
    """Quét thư mục ExCode và trả về cấu trúc Thư mục -> [Danh sách file]"""
    base_dir = "ExCode"
    examples = {}
    if not os.path.exists(base_dir):
        return examples
    
    try:
        for folder_name in os.listdir(base_dir):
            folder_path = os.path.join(base_dir, folder_name)
            if os.path.isdir(folder_path):
                files = []
                for file_name in os.listdir(folder_path):
                    if file_name.endswith('.py') or file_name.endswith('.cpp'):
                        files.append(file_name)
                if files:
                    examples[folder_name] = files
        return examples
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/examples/{folder}/{filename}")
async def get_example_code(folder: str, filename: str):
    """Lấy nội dung của file code mẫu"""
    safe_folder = os.path.basename(folder)
    safe_filename = os.path.basename(filename)
    file_path = os.path.join("ExCode", safe_folder, safe_filename)
    
    if not os.path.exists(file_path):
        return {"error": "File không tồn tại"}
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"code": content}
    except Exception as e:
        return {"error": str(e)}