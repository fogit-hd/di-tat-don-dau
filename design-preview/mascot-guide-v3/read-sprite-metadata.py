"""Compatibility command. Use actual whole-actor extents and torso calibration."""
from pathlib import Path
import runpy
root=Path(__file__).resolve().parent
runpy.run_path(str(root/'analyze-safe-sprites.py'),run_name='__main__')
runpy.run_path(str(root/'build-safe-sprites.py'),run_name='__main__')

