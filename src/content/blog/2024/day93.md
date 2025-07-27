---
author: Anubhav Gain
pubDatetime: 2024-09-29T10:00:00+05:30
modDatetime: 2024-09-29T10:00:00+05:30
title: Day 93 - MLOps - Operationalizing Machine Learning at Scale
slug: day93
featured: false
draft: false
tags:
  - MLOps
  - MachineLearning
  - DevOps
  - DataScience
  - AI
  - Automation
description: Exploring MLOps practices, tools, and workflows for deploying, monitoring, and maintaining machine learning models in production environments.
---

# Day 93 - MLOps: Operationalizing Machine Learning at Scale

[![Watch the video](/thumbnails/day93.png)](https://www.youtube.com/watch?v=placeholder93)

Machine Learning Operations (MLOps) bridges the gap between experimental ML development and reliable production systems. As organizations increasingly rely on ML models for critical decisions, the need for robust MLOps practices has never been greater. Today, we'll explore how to build scalable, maintainable ML systems that deliver consistent value in production.

## Understanding MLOps

MLOps applies DevOps principles to machine learning workflows, addressing unique challenges like:

- **Data Drift**: When production data differs from training data
- **Model Decay**: Performance degradation over time
- **Reproducibility**: Ensuring experiments can be replicated
- **Versioning**: Managing models, data, and code versions
- **Monitoring**: Tracking model performance and data quality

## The MLOps Lifecycle

### 1. Data Engineering

Robust data pipelines form the foundation of successful ML systems:

```python
# Example: Data validation with Great Expectations
import great_expectations as ge
import pandas as pd

# Create expectation suite
df = ge.read_csv("data/training_data.csv")

# Define data quality expectations
df.expect_column_values_to_not_be_null("customer_id")
df.expect_column_values_to_be_between("age", min_value=18, max_value=120)
df.expect_column_values_to_be_in_set("country", ["US", "UK", "CA", "AU"])
df.expect_column_mean_to_be_between("purchase_amount", min_value=10, max_value=1000)

# Validate incoming data
validation_results = df.validate()
if not validation_results["success"]:
    raise ValueError("Data quality check failed")
```

### 2. Feature Engineering

Feature stores centralize feature computation and serving:

```python
# Example: Feast feature store configuration
from feast import Entity, Feature, FeatureView, FileSource, ValueType
from datetime import timedelta

# Define data source
driver_stats = FileSource(
    path="data/driver_stats.parquet",
    event_timestamp_column="event_timestamp",
    created_timestamp_column="created_timestamp"
)

# Define entity
driver = Entity(name="driver_id", value_type=ValueType.INT64)

# Define feature view
driver_stats_fv = FeatureView(
    name="driver_activity",
    entities=["driver_id"],
    ttl=timedelta(days=7),
    features=[
        Feature(name="trips_today", dtype=ValueType.INT64),
        Feature(name="avg_trip_distance", dtype=ValueType.FLOAT),
        Feature(name="rating", dtype=ValueType.FLOAT),
    ],
    online=True,
    source=driver_stats,
)

# Retrieve features for inference
from feast import FeatureStore

store = FeatureStore(".")
features = store.get_online_features(
    features=[
        "driver_activity:trips_today",
        "driver_activity:avg_trip_distance",
        "driver_activity:rating",
    ],
    entity_rows=[{"driver_id": 12345}],
).to_dict()
```

### 3. Model Development

Experiment tracking ensures reproducibility:

```python
# Example: MLflow experiment tracking
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score

# Start MLflow run
with mlflow.start_run(run_name="rf_classifier_v1"):
    # Log parameters
    n_estimators = 100
    max_depth = 10
    mlflow.log_param("n_estimators", n_estimators)
    mlflow.log_param("max_depth", max_depth)

    # Train model
    rf_model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=42
    )
    rf_model.fit(X_train, y_train)

    # Make predictions
    predictions = rf_model.predict(X_test)

    # Log metrics
    accuracy = accuracy_score(y_test, predictions)
    f1 = f1_score(y_test, predictions, average='weighted')
    mlflow.log_metric("accuracy", accuracy)
    mlflow.log_metric("f1_score", f1)

    # Log model
    mlflow.sklearn.log_model(
        sk_model=rf_model,
        artifact_path="model",
        registered_model_name="fraud_detection_model"
    )

    # Log additional artifacts
    mlflow.log_artifact("data/feature_importance.png")
    mlflow.set_tag("model_type", "RandomForest")
```

### 4. Model Deployment

Containerized model serving with BentoML:

```python
# service.py
import bentoml
import numpy as np
from bentoml.io import NumpyNdarray, JSON

# Load the model
fraud_model = bentoml.sklearn.get("fraud_detector:latest").to_runner()

# Create service
svc = bentoml.Service("fraud_detection_service", runners=[fraud_model])

# Define API endpoint
@svc.api(input=NumpyNdarray(), output=JSON())
async def predict(input_data: np.ndarray) -> dict:
    prediction = await fraud_model.predict.async_run(input_data)
    confidence = await fraud_model.predict_proba.async_run(input_data)

    return {
        "prediction": int(prediction[0]),
        "confidence": float(confidence[0].max()),
        "fraud_probability": float(confidence[0][1])
    }

# Health check endpoint
@svc.api(input=JSON(), output=JSON())
def health_check(input_data: dict) -> dict:
    return {"status": "healthy", "service": "fraud_detection"}
```

```yaml
# bentofile.yaml
service: "service:svc"
labels:
  owner: ml-team
  stage: production
include:
  - "*.py"
python:
  packages:
    - scikit-learn
    - numpy
    - pandas
docker:
  base_image: python:3.9-slim
  system_packages:
    - libgomp1
```

### 5. Model Monitoring

Implement comprehensive monitoring with Evidently:

```python
# monitoring.py
import evidently
from evidently.dashboard import Dashboard
from evidently.dashboard.tabs import DataDriftTab, CatTargetDriftTab
from evidently.model_profile import Profile
from evidently.model_profile.sections import DataDriftProfileSection

# Create monitoring dashboard
def create_monitoring_dashboard(reference_data, production_data, column_mapping):
    # Create dashboard
    dashboard = Dashboard(tabs=[
        DataDriftTab(),
        CatTargetDriftTab()
    ])

    # Calculate dashboard
    dashboard.calculate(
        reference_data=reference_data,
        production_data=production_data,
        column_mapping=column_mapping
    )

    # Save dashboard
    dashboard.save("reports/data_drift_dashboard.html")

    # Create drift profile
    profile = Profile(sections=[DataDriftProfileSection()])
    profile.calculate(reference_data, production_data, column_mapping)

    # Get drift metrics
    drift_results = profile.json()
    return drift_results

# Alert on significant drift
def check_drift_alerts(drift_results):
    alerts = []
    drift_score = drift_results["data_drift"]["metrics"]["dataset_drift_score"]

    if drift_score > 0.5:
        alerts.append({
            "severity": "high",
            "message": f"Significant data drift detected: {drift_score:.2f}",
            "timestamp": datetime.now().isoformat()
        })

    # Check individual feature drift
    for feature, metrics in drift_results["data_drift"]["metrics"]["features"].items():
        if metrics["drift_score"] > 0.7:
            alerts.append({
                "severity": "medium",
                "feature": feature,
                "message": f"Feature drift detected: {metrics['drift_score']:.2f}",
                "timestamp": datetime.now().isoformat()
            })

    return alerts
```

## MLOps Pipeline Architecture

### Complete Pipeline with Kubeflow

```yaml
# kubeflow_pipeline.py
import kfp
from kfp import dsl
from kfp.components import InputPath, OutputPath

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['pandas', 'scikit-learn', 'feast']
)
def prepare_features(
    data_path: InputPath(str),
    features_path: OutputPath(str)
):
    import pandas as pd
    from feast import FeatureStore

    # Load data
    df = pd.read_csv(data_path)

    # Get features from feature store
    store = FeatureStore(".")
    training_df = store.get_historical_features(
        entity_df=df,
        features=[
            "driver_activity:trips_today",
            "driver_activity:avg_trip_distance",
        ],
    ).to_df()

    # Save features
    training_df.to_csv(features_path, index=False)

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['scikit-learn', 'mlflow']
)
def train_model(
    features_path: InputPath(str),
    model_path: OutputPath(str),
    metrics_path: OutputPath(dict)
):
    import pandas as pd
    import mlflow
    import json
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score, f1_score

    # Load features
    df = pd.read_csv(features_path)
    X = df.drop("target", axis=1)
    y = df["target"]

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    f1 = f1_score(y_test, predictions, average='weighted')

    # Save model
    import joblib
    joblib.dump(model, model_path)

    # Save metrics
    metrics = {"accuracy": accuracy, "f1_score": f1}
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f)

@dsl.component(
    base_image='python:3.9',
    packages_to_install=['bentoml', 'scikit-learn']
)
def deploy_model(
    model_path: InputPath(str),
    metrics_path: InputPath(dict),
    deployment_endpoint: OutputPath(str)
):
    import json
    import joblib
    import bentoml

    # Load metrics
    with open(metrics_path, 'r') as f:
        metrics = json.load(f)

    # Deploy only if metrics meet threshold
    if metrics["accuracy"] > 0.85:
        # Load model
        model = joblib.load(model_path)

        # Save to BentoML
        bentoml.sklearn.save_model(
            "fraud_detector",
            model,
            labels={
                "accuracy": str(metrics["accuracy"]),
                "f1_score": str(metrics["f1_score"])
            }
        )

        # Build and push container
        bento = bentoml.build(
            "service:svc",
            labels={"stage": "production"}
        )

        # Deploy to Kubernetes
        endpoint = f"http://fraud-detector.ml-models.svc.cluster.local"
        with open(deployment_endpoint, 'w') as f:
            f.write(endpoint)

@dsl.pipeline(
    name="Fraud Detection Pipeline",
    description="End-to-end ML pipeline for fraud detection"
)
def ml_pipeline(data_path: str):
    # Prepare features
    features_task = prepare_features(data_path=data_path)

    # Train model
    train_task = train_model(features_path=features_task.outputs["features_path"])

    # Deploy model
    deploy_task = deploy_model(
        model_path=train_task.outputs["model_path"],
        metrics_path=train_task.outputs["metrics_path"]
    )

    return deploy_task.outputs["deployment_endpoint"]

# Compile and run pipeline
if __name__ == "__main__":
    kfp.compiler.Compiler().compile(
        pipeline_func=ml_pipeline,
        package_path="fraud_detection_pipeline.yaml"
    )
```

## Model Governance and Compliance

### Model Registry with MLflow

```python
# model_governance.py
from mlflow.tracking import MlflowClient
from datetime import datetime
import json

class ModelGovernance:
    def __init__(self):
        self.client = MlflowClient()

    def register_model(self, model_name, run_id, tags):
        """Register model with governance metadata"""
        # Create registered model
        self.client.create_registered_model(
            name=model_name,
            tags={
                "compliance_checked": "pending",
                "risk_assessment": "required",
                "data_privacy": "gdpr_compliant",
                **tags
            }
        )

        # Create model version
        model_version = self.client.create_model_version(
            name=model_name,
            source=f"runs:/{run_id}/model",
            run_id=run_id,
            tags={
                "created_by": tags.get("created_by", "unknown"),
                "created_at": datetime.now().isoformat(),
                "approval_status": "pending"
            }
        )

        return model_version

    def approve_model(self, model_name, version, approver, comments):
        """Approve model for production"""
        # Update approval status
        self.client.set_model_version_tag(
            name=model_name,
            version=version,
            key="approval_status",
            value="approved"
        )

        # Add approval metadata
        approval_info = {
            "approver": approver,
            "approved_at": datetime.now().isoformat(),
            "comments": comments
        }

        self.client.set_model_version_tag(
            name=model_name,
            version=version,
            key="approval_info",
            value=json.dumps(approval_info)
        )

        # Transition to production
        self.client.transition_model_version_stage(
            name=model_name,
            version=version,
            stage="Production",
            archive_existing_versions=True
        )

    def audit_model_lineage(self, model_name, version):
        """Get complete model lineage for audit"""
        model_version = self.client.get_model_version(
            name=model_name,
            version=version
        )

        run = self.client.get_run(model_version.run_id)

        lineage = {
            "model_name": model_name,
            "version": version,
            "run_id": model_version.run_id,
            "source_code": run.data.tags.get("mlflow.source.name"),
            "git_commit": run.data.tags.get("mlflow.source.git.commit"),
            "training_data": run.data.params.get("training_data_version"),
            "hyperparameters": run.data.params,
            "metrics": run.data.metrics,
            "created_at": model_version.creation_timestamp,
            "tags": model_version.tags
        }

        return lineage
```

## A/B Testing and Gradual Rollout

### Canary Deployment with Seldon

```yaml
# seldon-deployment.yaml
apiVersion: machinelearning.seldon.io/v1
kind: SeldonDeployment
metadata:
  name: fraud-detector
spec:
  predictors:
    - name: stable
      replicas: 3
      traffic: 90
      graph:
        name: fraud-model
        implementation: SKLEARN_SERVER
        modelUri: s3://models/fraud-detector/v1
      componentSpecs:
        - spec:
            containers:
              - name: fraud-model
                resources:
                  requests:
                    memory: "1Gi"
                    cpu: "100m"
    - name: canary
      replicas: 1
      traffic: 10
      graph:
        name: fraud-model
        implementation: SKLEARN_SERVER
        modelUri: s3://models/fraud-detector/v2
      componentSpecs:
        - spec:
            containers:
              - name: fraud-model
                resources:
                  requests:
                    memory: "1Gi"
                    cpu: "100m"
```

### Progressive Rollout Controller

```python
# progressive_rollout.py
class ProgressiveRollout:
    def __init__(self, deployment_name, metrics_client):
        self.deployment_name = deployment_name
        self.metrics_client = metrics_client

    def evaluate_canary(self, canary_version, stable_version, duration_minutes=30):
        """Evaluate canary performance against stable"""
        # Get metrics for both versions
        canary_metrics = self.metrics_client.get_metrics(
            model_version=canary_version,
            duration=duration_minutes
        )

        stable_metrics = self.metrics_client.get_metrics(
            model_version=stable_version,
            duration=duration_minutes
        )

        # Compare key metrics
        metrics_comparison = {
            "latency_improvement": (
                stable_metrics["avg_latency"] - canary_metrics["avg_latency"]
            ) / stable_metrics["avg_latency"],
            "accuracy_delta": canary_metrics["accuracy"] - stable_metrics["accuracy"],
            "error_rate_delta": canary_metrics["error_rate"] - stable_metrics["error_rate"]
        }

        # Decision logic
        if (metrics_comparison["accuracy_delta"] > -0.01 and  # No significant accuracy drop
            metrics_comparison["error_rate_delta"] < 0.01 and  # No increase in errors
            metrics_comparison["latency_improvement"] > -0.1):  # Latency not worse by 10%
            return "promote"
        else:
            return "rollback"

    def update_traffic_split(self, canary_traffic_percentage):
        """Update traffic split between stable and canary"""
        # Update Seldon deployment
        patch = {
            "spec": {
                "predictors": [
                    {"name": "stable", "traffic": 100 - canary_traffic_percentage},
                    {"name": "canary", "traffic": canary_traffic_percentage}
                ]
            }
        }

        # Apply patch to Kubernetes
        return patch
```

## Cost Optimization in MLOps

### Resource Management

```python
# resource_optimizer.py
class MLResourceOptimizer:
    def __init__(self):
        self.gpu_costs = {"v100": 2.48, "t4": 0.526, "a100": 3.06}  # $/hour

    def optimize_batch_inference(self, model_size_gb, dataset_size_gb, sla_hours):
        """Optimize resource allocation for batch inference"""
        # Estimate compute requirements
        inference_time_cpu = dataset_size_gb * 0.5  # hours (rough estimate)
        inference_time_gpu = dataset_size_gb * 0.05  # hours (10x speedup)

        # Calculate costs
        cpu_cost = inference_time_cpu * 0.096  # c5.xlarge pricing
        gpu_options = {}

        for gpu_type, hourly_cost in self.gpu_costs.items():
            if gpu_type == "t4" and model_size_gb > 8:
                continue  # T4 has 16GB memory limit

            total_cost = inference_time_gpu * hourly_cost
            if inference_time_gpu <= sla_hours:
                gpu_options[gpu_type] = total_cost

        # Recommendation
        if min(gpu_options.values()) < cpu_cost:
            best_gpu = min(gpu_options, key=gpu_options.get)
            return {
                "recommendation": "gpu",
                "instance_type": best_gpu,
                "estimated_cost": gpu_options[best_gpu],
                "estimated_time": inference_time_gpu
            }
        else:
            return {
                "recommendation": "cpu",
                "instance_type": "c5.xlarge",
                "estimated_cost": cpu_cost,
                "estimated_time": inference_time_cpu
            }

    def auto_scale_serving(self, current_qps, target_latency_ms):
        """Calculate optimal serving infrastructure"""
        # Model serving capacity (requests per second per replica)
        capacity_per_replica = 100

        # Calculate required replicas
        required_replicas = math.ceil(current_qps / capacity_per_replica)

        # Add buffer for reliability
        recommended_replicas = int(required_replicas * 1.3)

        return {
            "min_replicas": required_replicas,
            "max_replicas": recommended_replicas,
            "target_cpu_utilization": 70,
            "scale_down_delay": 300  # seconds
        }
```

## Best Practices for MLOps

1. **Version Everything**: Models, data, code, and configurations
2. **Automate Testing**: Unit tests for code, integration tests for pipelines
3. **Monitor Continuously**: Track both model and data quality metrics
4. **Implement Gradual Rollouts**: Use canary deployments for safety
5. **Maintain Reproducibility**: Document and version all experiments
6. **Optimize Resources**: Balance performance with cost efficiency
7. **Ensure Compliance**: Implement proper governance and audit trails

## Conclusion

MLOps transforms machine learning from experimental notebooks to production-grade systems. By implementing proper versioning, monitoring, deployment strategies, and governance, organizations can reliably deploy and maintain ML models at scale. The key is to start simple and gradually add sophistication as your ML operations mature.

## Additional Resources

- [MLOps: Continuous Delivery and Automation Pipelines in Machine Learning](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)
- [The ML Test Score: A Rubric for ML Production Readiness](https://research.google/pubs/pub46555/)
- [MLflow Documentation](https://mlflow.org/)
- [Kubeflow - The Machine Learning Toolkit for Kubernetes](https://www.kubeflow.org/)
- [Feast - Feature Store for Machine Learning](https://feast.dev/)

Tomorrow, we'll explore Zero Trust Security in Multi-Cloud Environments. See you then!
