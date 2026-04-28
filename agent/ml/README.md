# Phase 8: Endpoint Machine Learning (Teammate Hand-off)

Hello! The infrastructure layer (Docker, React, Dependencies, and Backend LLM integration) is fully built and deployed for Phase 8 and Phase 9. 

Your job is strictly the Python Machine Learning logic for the Agent! 
The required dependencies (`scikit-learn`, `numpy`, `joblib`) are already installed in the Dockerfile.

## Your Scaffolds

We've provided two empty stub files for you to build the Edge ML anomaly detection layer:

### 1. `agent/ml/train_model.py`
This script should run exactly once during development.
- Write a script that trains an `IsolationForest` on normal system behavior (CPU, Memory, Packets).
- Using `joblib`, dump the trained model to `agent/ml/anomaly_model.pkl`.

### 2. `agent/detectors/ai_monitor.py`
This is the live endpoint detector thread.
- Write the logic inside `start_ai_monitor()`.
- Load your `anomaly_model.pkl` file.
- Add an infinite `while True:` loop.
- Use `psutil` to extract live feature arrays.
- If `model.predict()` returns `-1`, emit an 'AI Behavioral Anomaly' alert using the predefined `send_alert()` function.

Once you write the code in these two stubs, the entire pipeline will magically work! The backend is already wired to intercept your `AI Behavioral Anomaly` alerts and pass them to the Google Gemini SOC Copilot API. Good luck!
