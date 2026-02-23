import os, sys, traceback, importlib

print("PWD:", os.getcwd(), flush=True)
print("sys.path:", sys.path, flush=True)

try:
    importlib.import_module("app.main")
    print("OK: imported app.main", flush=True)
except Exception as e:
    print("FAIL: importing app.main:", repr(e), flush=True)
    traceback.print_exc()
    raise