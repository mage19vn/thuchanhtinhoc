from pygdbmi.gdbcontroller import GdbController
import subprocess
import json

def trace_cpp_code(cpp_code: str):
    # 1. Lưu code ra file
    with open("temp.cpp", "w") as f:
        f.write(cpp_code)
    
    # 2. Biên dịch với cờ -g (Debug symbols)
    compile_result = subprocess.run(
        ["g++", "-g", "-O0", "temp.cpp", "-o", "temp.out"],
        capture_output=True, text=True
    )
    if compile_result.returncode != 0:
        return {"error": compile_result.stderr}

    # 3. Khởi tạo GDB Controller
    gdbmi = GdbController()
    gdbmi.write("-file-exec-and-symbols temp.out")
    
    # Đặt breakpoint ở hàm main
    gdbmi.write("-break-insert main")
    
    # Bắt đầu chạy
    gdbmi.write("-exec-run")
    
    trace_steps = []
    
    while True:
        # Gửi lệnh step (bước qua dòng lệnh)
        responses = gdbmi.write("-exec-step")
        
        # Kiểm tra xem chương trình đã kết thúc chưa
        is_finished = any(r.get("payload", {}).get("reason") == "exited-normally" for r in responses)
        if is_finished:
            break
            
        # Lấy thông tin biến cục bộ tại dòng hiện tại
        local_vars_response = gdbmi.write("-stack-list-variables --print-values")
        
        # Lấy số dòng hiện tại
        frame_response = gdbmi.write("-stack-info-frame")
        
        # Lọc và parse dữ liệu cần thiết từ JSON của GDB
        current_line = extract_line_number(frame_response)
        variables = extract_variables(local_vars_response)
        
        if current_line:
            trace_steps.append({
                "line": current_line,
                "variables": variables
            })
            
    return {"trace": trace_steps}

# Các hàm phụ trợ tự định nghĩa để parse dict trả về từ pygdbmi
def extract_line_number(responses):
    for r in responses:
        if r.get("type") == "result" and "frame" in r.get("payload", {}):
            return r["payload"]["frame"].get("line")
    return None

def extract_variables(responses):
    # Parse payload để lấy tên và giá trị của biến
    # Output mẫu: [{'name': 'a', 'value': '5'}, {'name': 'b', 'value': '10'}]
    pass