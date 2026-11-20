import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score, mean_absolute_error, mean_squared_error, r2_score

# 1. load the dataset (text columns stay as text)
df = pd.read_csv("data/Dataset.csv")

# 2. inputs (10 user values) and outputs (13 therapy values)
input_cols = ["Age", "BMI", "Body_Fat_Percent", "Skin_Temperature_C", "Diabetic",
              "Pain_Level", "Pain_Duration_Weeks", "Neuropathic_Score",
              "Stiffness_Level", "Muscle_Spasm_Level"]

number_outputs = ["Heat_Temperature_C", "Heat_Duration_Min",
                  "Vibration_Frequency_Hz", "Vibration_Amplitude_mm", "Vibration_Duration_Min",
                  "TENS_Frequency_Hz", "TENS_Pulse_Width_us", "TENS_Duration_Min"]

text_outputs = ["Heat_Setting", "Vibration_Pattern", "TENS_Mode",
                "TENS_Intensity", "TENS_Electrode_Placement"]

# 3. split: 80% training, 20% testing
train, test = train_test_split(df, test_size=0.2, random_state=42)
X_train, X_test = train[input_cols], test[input_cols]

models = {}
results = []

# 4. number outputs -> Multiple Linear Regression
for col in number_outputs:
    model = LinearRegression()
    model.fit(X_train, train[col])
    pred = model.predict(X_test)

    models[col] = model
    results.append({"Model": "Linear", "Output": col, "Type": "Regression",
                    "MAE": mean_absolute_error(test[col], pred),
                    "MSE": mean_squared_error(test[col], pred),
                    "R2": r2_score(test[col], pred)})

# 5. text outputs -> Logistic Regression
for col in text_outputs:
    # scale the inputs first so Logistic Regression trains properly
    model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
    model.fit(X_train, train[col])
    pred = model.predict(X_test)

    models[col] = model
    results.append({"Model": "Linear", "Output": col, "Type": "Classification",
                    "Accuracy": accuracy_score(test[col], pred)})

# 6. show the results
results = pd.DataFrame(results)
print(results.round(3).to_string(index=False))
print("\nAverage R2       :", round(results["R2"].mean(), 3))
print("Average Accuracy :", round(results["Accuracy"].mean(), 3))

# 7. save the models and the results
os.makedirs("models", exist_ok=True)
os.makedirs("results", exist_ok=True)
joblib.dump(models, "models/linear_model.pkl", compress=3)
results.to_csv("results/linear_model_metrics.csv", index=False)
print("\nSaved models/linear_model.pkl and results/linear_model_metrics.csv")
