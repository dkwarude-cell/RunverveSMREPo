import os
import pandas as pd
import matplotlib.pyplot as plt

# 1. load the results saved by the 3 training scripts
linear = pd.read_csv("results/linear_model_metrics.csv")
forest = pd.read_csv("results/random_forest_metrics.csv")
boost = pd.read_csv("results/gradient_boosting_metrics.csv")
results = pd.concat([linear, forest, boost])

reg = results[results["Type"] == "Regression"]
cls = results[results["Type"] == "Classification"]

# 2. summary table: average score of each model
summary = pd.DataFrame({
    "Average Accuracy": cls.groupby("Model")["Accuracy"].mean(),
    "Average R2": reg.groupby("Model")["R2"].mean(),
    "Average MAE": reg.groupby("Model")["MAE"].mean(),
    "Average MSE": reg.groupby("Model")["MSE"].mean(),
})
print(summary.round(3))
best = summary["Average R2"].idxmax()
print("\nBest model:", best)

os.makedirs("results", exist_ok=True)
summary.round(4).to_csv("results/model_comparison.csv")

# 3. graphs
colors = ["#2a78d6", "#eb6834", "#1baf7a"]

# graph 1: average accuracy and average R2 of each model
summary[["Average Accuracy", "Average R2"]].plot(kind="bar", color=colors[:2], figsize=(7, 4))
plt.title("Average Accuracy and R2 of each model")
plt.ylabel("Score (1.0 = perfect)")
plt.ylim(0, 1.3)
plt.legend(loc="upper center", ncol=3)
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig("results/1_accuracy_and_r2.png")

# graph 2: R2 for every number output
reg.pivot(index="Output", columns="Model", values="R2").plot(kind="bar", color=colors, figsize=(10, 5))
plt.title("R2 score for each therapy value (higher is better)")
plt.ylabel("R2")
plt.ylim(0, 1.3)
plt.legend(loc="upper center", ncol=3)
plt.xticks(rotation=30, ha="right")
plt.tight_layout()
plt.savefig("results/2_r2_per_output.png")

# graph 3: MAE for every number output
reg.pivot(index="Output", columns="Model", values="MAE").plot(kind="bar", color=colors, figsize=(10, 5))
plt.title("Mean Absolute Error for each therapy value (lower is better)")
plt.ylabel("MAE (in the unit of each value)")
plt.legend(loc="upper left")
plt.xticks(rotation=30, ha="right")
plt.tight_layout()
plt.savefig("results/3_mae_per_output.png")

# graph 4: accuracy for every text output
cls.pivot(index="Output", columns="Model", values="Accuracy").plot(kind="bar", color=colors, figsize=(10, 5))
plt.title("Accuracy for each therapy category (higher is better)")
plt.ylabel("Accuracy")
plt.ylim(0, 1.3)
plt.legend(loc="upper center", ncol=3)
plt.xticks(rotation=30, ha="right")
plt.tight_layout()
plt.savefig("results/4_accuracy_per_output.png")

print("\nSaved results/model_comparison.csv and 4 graphs in results/")
plt.show()
