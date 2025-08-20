---
author: Anubhav Gain
pubDatetime: 2024-04-02T15:30:00+05:30
modDatetime: 2024-04-10T15:30:00+05:30
title: "DevOps Resources and References"
slug: 90days-93-devops-resources-and-references
featured: false
draft: false
tags:
  - community
  - learning
  - career
  - devops-journey
  - resources
category: Community & Learning
description: "Day 93 of 90 Days of DevOps - DevOps Resources and References. Part of the Community & Learning series covering essential DevOps concepts and hands-on practices."
---

# Day 93 - MLOps: Operationalizing Machine Learning at Scale

[![Watch the video](/thumbnails/day93.png)](https://www.youtube.com/watch?v=VIDEO_ID_HERE)

Machine Learning Operations (MLOps) has emerged as a critical discipline that bridges the gap between ML development and production deployment. Today, we'll explore how to build robust, scalable ML systems that can handle the unique challenges of operationalizing machine learning models.

## The MLOps Challenge

Traditional software follows deterministic patterns, but ML introduces unique complexities:

- **Data Dependency**: Models are only as good as their training data
- **Model Drift**: Performance degrades over time as data distributions change
- **Experimentation**: Hundreds of experiments before production-ready models
- **Reproducibility**: Ensuring consistent results across environments
- **Monitoring**: Tracking not just system metrics but model performance

## The MLOps Lifecycle

### 1. Data Engineering & Feature Engineering

The foundation of any ML system is robust data pipelines.

```python
# Feature Store Implementation with Feast
from feast import FeatureStore
import pandas as pd
from datetime import datetime, timedelta

# Initialize feature store
store = FeatureStore(repo_path="feature_repo/")

# Define feature retrieval
entity_df = pd.DataFrame({
    "customer_id": [1001, 1002, 1003],
    "event_timestamp": [
        datetime.now() - timedelta(hours=3),
        datetime.now() - timedelta(hours=2),
        datetime.now() - timedelta(hours=1)
    ]
})

# Retrieve features
training_df = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "customer_stats:total_transactions",
        "customer_stats:avg_transaction_amount",
        "customer_stats:days_since_last_purchase"
    ]
).to_df()

# Feature validation
from great_expectations import DataContext

context = DataContext()
batch = context.get_batch(
    datasource_name="customer_features",
    data_asset_name="training_features"
)

# Define expectations
batch.expect_column_values_to_not_be_null("customer_id")
batch.expect_column_values_to_be_between(
    "avg_transaction_amount",
    min_value=0,
    max_value=10000
)

# Validate
results = batch.validate()
```

### 2. Experiment Tracking

Track experiments systematically to ensure reproducibility.

```python
# MLflow Experiment Tracking
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score
import numpy as np

# Start MLflow run
with mlflow.start_run(run_name="rf_customer_churn_v3"):
    # Log parameters
    n_estimators = 100
    max_depth = 10
    mlflow.log_param("n_estimators", n_estimators)
    mlflow.log_param("max_depth", max_depth)
    mlflow.log_param("feature_set_version", "v2.1")

    # Train model
    rf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=42
    )
    rf.fit(X_train, y_train)

    # Make predictions
    y_pred = rf.predict(X_test)
    y_pred_proba = rf.predict_proba(X_test)[:, 1]

    # Log metrics
    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_pred_proba)
    mlflow.log_metric("accuracy", accuracy)
    mlflow.log_metric("auc", auc)

    # Log model
    mlflow.sklearn.log_model(
        rf,
        "model",
        registered_model_name="customer_churn_classifier"
    )

    # Log feature importance
    feature_importance = pd.DataFrame({
        'feature': X_train.columns,
        'importance': rf.feature_importances_
    }).sort_values('importance', ascending=False)

    mlflow.log_table(feature_importance, "feature_importance.json")

    # Log artifacts
    mlflow.log_artifact("preprocessing_pipeline.pkl")
    mlflow.log_artifact("model_config.yaml")
```

### 3. Model Training Pipeline

Automated training pipelines ensure consistency and scalability.

```python
# Kubeflow Pipeline for Model Training
import kfp
from kfp import dsl
from kfp.components import func_to_container_op

# Define pipeline components
@func_to_container_op
def load_data(data_path: str) -> str:
    import pandas as pd
    import boto3
    from io import StringIO

    s3 = boto3.client('s3')
    obj = s3.get_object(Bucket='ml-data', Key=data_path)
    df = pd.read_csv(StringIO(obj['Body'].read().decode('utf-8')))

    # Save to shared volume
    df.to_csv('/mnt/data/raw_data.csv', index=False)
    return '/mnt/data/raw_data.csv'

@func_to_container_op
def preprocess_data(data_path: str) -> str:
    import pandas as pd
    from sklearn.preprocessing import StandardScaler
    import joblib

    df = pd.read_csv(data_path)

    # Feature engineering
    df['total_spend_per_transaction'] = df['total_spend'] / df['transaction_count']
    df['days_since_registration'] = (pd.Timestamp.now() - pd.to_datetime(df['registration_date'])).dt.days

    # Scaling
    scaler = StandardScaler()
    numeric_features = ['total_spend', 'transaction_count', 'days_since_registration']
    df[numeric_features] = scaler.fit_transform(df[numeric_features])

    # Save preprocessor
    joblib.dump(scaler, '/mnt/model/preprocessor.pkl')

    # Save processed data
    df.to_csv('/mnt/data/processed_data.csv', index=False)
    return '/mnt/data/processed_data.csv'

@func_to_container_op
def train_model(data_path: str, model_type: str) -> str:
    import pandas as pd
    import joblib
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    import mlflow

    df = pd.read_csv(data_path)
    X = df.drop(['target', 'customer_id'], axis=1)
    y = df['target']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    if model_type == 'random_forest':
        model = RandomForestClassifier(n_estimators=100, random_state=42)
    else:
        model = LogisticRegression(random_state=42)

    model.fit(X_train, y_train)

    # Save model
    model_path = f'/mnt/model/{model_type}_model.pkl'
    joblib.dump(model, model_path)

    # Log to MLflow
    mlflow.log_model(model, model_type)

    return model_path

@func_to_container_op
def evaluate_model(model_path: str, data_path: str) -> float:
    import pandas as pd
    import joblib
    from sklearn.metrics import roc_auc_score
    import mlflow

    model = joblib.load(model_path)
    df = pd.read_csv(data_path)

    X = df.drop(['target', 'customer_id'], axis=1)
    y = df['target']

    predictions = model.predict_proba(X)[:, 1]
    auc = roc_auc_score(y, predictions)

    mlflow.log_metric("test_auc", auc)

    return auc

# Define pipeline
@dsl.pipeline(
    name='Customer Churn Training Pipeline',
    description='End-to-end ML training pipeline'
)
def ml_pipeline(data_path: str = 'data/customers.csv'):
    # Pipeline DAG
    data = load_data(data_path)
    processed_data = preprocess_data(data.output)

    # Train multiple models in parallel
    rf_model = train_model(processed_data.output, 'random_forest')
    lr_model = train_model(processed_data.output, 'logistic_regression')

    # Evaluate models
    rf_score = evaluate_model(rf_model.output, processed_data.output)
    lr_score = evaluate_model(lr_model.output, processed_data.output)

    # Select best model
    with dsl.Condition(rf_score.output > lr_score.output):
        deploy_model(rf_model.output)

# Compile and run pipeline
kfp.compiler.Compiler().compile(ml_pipeline, 'ml_pipeline.yaml')
```

### 4. Model Deployment

Deploy models with proper versioning and rollback capabilities.

```python
# Model Serving with BentoML
import bentoml
from bentoml.io import JSON, NumpyNdarray
import numpy as np

# Define service
@bentoml.env(pip_packages=["scikit-learn", "pandas", "numpy"])
@bentoml.artifacts([
    bentoml.artifact.PickleArtifact("model"),
    bentoml.artifact.PickleArtifact("preprocessor")
])
class ChurnPredictionService(bentoml.BentoService):

    @bentoml.api(input=JSON(), output=JSON())
    def predict(self, input_data):
        # Preprocess input
        features = self.artifacts.preprocessor.transform(
            pd.DataFrame([input_data])
        )

        # Make prediction
        prediction = self.artifacts.model.predict_proba(features)[0]

        return {
            "customer_id": input_data["customer_id"],
            "churn_probability": float(prediction[1]),
            "prediction": "churn" if prediction[1] > 0.5 else "retain",
            "model_version": self.version
        }

    @bentoml.api(input=JSON(), output=JSON())
    def batch_predict(self, input_data):
        df = pd.DataFrame(input_data["customers"])
        features = self.artifacts.preprocessor.transform(df)
        predictions = self.artifacts.model.predict_proba(features)

        results = []
        for i, customer in enumerate(input_data["customers"]):
            results.append({
                "customer_id": customer["customer_id"],
                "churn_probability": float(predictions[i][1]),
                "prediction": "churn" if predictions[i][1] > 0.5 else "retain"
            })

        return {"predictions": results}

# Save service
svc = ChurnPredictionService()
svc.pack("model", model)
svc.pack("preprocessor", preprocessor)
svc.save()

# Deploy with Kubernetes
# bentoml containerize ChurnPredictionService:latest
# bentoml deploy ChurnPredictionService:latest --platform=kubernetes
```

### Kubernetes Deployment Configuration

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: churn-prediction-service
  namespace: ml-models
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "2"
        autoscaling.knative.dev/maxScale: "100"
        autoscaling.knative.dev/target: "100"
    spec:
      containers:
        - image: gcr.io/project/churn-prediction:v1.2.0
          ports:
            - containerPort: 5000
          env:
            - name: MODEL_NAME
              value: "churn_classifier"
            - name: MODEL_VERSION
              value: "v1.2.0"
          resources:
            requests:
              memory: "2Gi"
              cpu: "1"
            limits:
              memory: "4Gi"
              cpu: "2"
              nvidia.com/gpu: "1" # For GPU inference
          readinessProbe:
            httpGet:
              path: /healthz
              port: 5000
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /healthz
              port: 5000
            initialDelaySeconds: 30
            periodSeconds: 10
```

### 5. Model Monitoring

Monitor model performance in production to detect drift and degradation.

```python
# Model Monitoring with Evidently
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset, TargetDriftPreset
from evidently.test_suite import TestSuite
from evidently.test_preset import DataQualityTestPreset
import pandas as pd
from datetime import datetime
import boto3

class ModelMonitor:
    def __init__(self, reference_data, model_name):
        self.reference_data = reference_data
        self.model_name = model_name
        self.s3_client = boto3.client('s3')

    def check_data_drift(self, current_data):
        """Check for data drift between reference and current data"""

        # Create column mapping
        column_mapping = ColumnMapping(
            target='target',
            prediction='prediction',
            numerical_features=['total_spend', 'transaction_count', 'days_since_registration'],
            categorical_features=['customer_segment', 'region']
        )

        # Create drift report
        drift_report = Report(metrics=[
            DataDriftPreset(),
            TargetDriftPreset()
        ])

        drift_report.run(
            reference_data=self.reference_data,
            current_data=current_data,
            column_mapping=column_mapping
        )

        # Extract results
        drift_results = drift_report.as_dict()

        # Check if drift detected
        drift_detected = False
        for metric in drift_results['metrics']:
            if metric.get('result', {}).get('drift_detected', False):
                drift_detected = True
                break

        # Log results
        self.log_monitoring_results({
            'timestamp': datetime.now().isoformat(),
            'model_name': self.model_name,
            'drift_detected': drift_detected,
            'drift_score': drift_results.get('metrics', [{}])[0].get('result', {}).get('drift_score', 0),
            'n_drifted_features': sum(1 for m in drift_results['metrics'] if m.get('result', {}).get('drift_detected', False))
        })

        # Alert if drift detected
        if drift_detected:
            self.send_alert(f"Data drift detected for model {self.model_name}")

        return drift_results

    def check_prediction_quality(self, predictions_df):
        """Monitor prediction quality metrics"""

        # Run quality tests
        test_suite = TestSuite(tests=[
            DataQualityTestPreset()
        ])

        test_suite.run(
            reference_data=self.reference_data,
            current_data=predictions_df
        )

        # Calculate performance metrics
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

        metrics = {
            'accuracy': accuracy_score(predictions_df['target'], predictions_df['prediction']),
            'precision': precision_score(predictions_df['target'], predictions_df['prediction']),
            'recall': recall_score(predictions_df['target'], predictions_df['prediction']),
            'f1_score': f1_score(predictions_df['target'], predictions_df['prediction'])
        }

        # Check for performance degradation
        performance_threshold = 0.85
        if metrics['accuracy'] < performance_threshold:
            self.send_alert(
                f"Model performance degraded: Accuracy {metrics['accuracy']:.2f} < {performance_threshold}"
            )
            self.trigger_retraining()

        return metrics

    def log_monitoring_results(self, results):
        """Log monitoring results to S3"""
        import json

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        key = f"monitoring/{self.model_name}/{timestamp}.json"

        self.s3_client.put_object(
            Bucket='ml-monitoring',
            Key=key,
            Body=json.dumps(results)
        )

    def send_alert(self, message):
        """Send alert via SNS"""
        sns_client = boto3.client('sns')
        sns_client.publish(
            TopicArn='arn:aws:sns:us-east-1:123456789:ml-alerts',
            Message=message,
            Subject=f'ML Model Alert: {self.model_name}'
        )

    def trigger_retraining(self):
        """Trigger model retraining pipeline"""
        import requests

        response = requests.post(
            'https://airflow.company.com/api/v1/dags/model_retraining/dagRuns',
            json={
                'conf': {
                    'model_name': self.model_name,
                    'trigger_reason': 'performance_degradation'
                }
            },
            headers={'Authorization': 'Bearer ' + os.getenv('AIRFLOW_TOKEN')}
        )

        print(f"Retraining triggered: {response.status_code}")
```

### 6. A/B Testing and Gradual Rollout

Safely deploy new models with controlled rollouts.

```python
# Feature Flag Based Model Routing
from flask import Flask, request, jsonify
import random
import json
from datetime import datetime

app = Flask(__name__)

class ModelRouter:
    def __init__(self):
        self.models = {
            'v1': ModelV1(),
            'v2': ModelV2()
        }
        self.rollout_config = {
            'v2_percentage': 10,  # Start with 10% traffic to v2
            'sticky_sessions': True,
            'excluded_segments': ['high_value_customers']
        }

    def get_model_version(self, customer_id, customer_segment):
        # Check if customer should be excluded from rollout
        if customer_segment in self.rollout_config['excluded_segments']:
            return 'v1'

        # Implement sticky sessions
        if self.rollout_config['sticky_sessions']:
            # Use consistent hashing for sticky routing
            hash_value = hash(customer_id) % 100
            if hash_value < self.rollout_config['v2_percentage']:
                return 'v2'
            return 'v1'

        # Random routing
        if random.random() * 100 < self.rollout_config['v2_percentage']:
            return 'v2'
        return 'v1'

router = ModelRouter()

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    customer_id = data['customer_id']
    customer_segment = data.get('customer_segment', 'standard')

    # Determine model version
    model_version = router.get_model_version(customer_id, customer_segment)
    model = router.models[model_version]

    # Make prediction
    start_time = datetime.now()
    prediction = model.predict(data)
    latency = (datetime.now() - start_time).total_seconds()

    # Log for analysis
    log_prediction({
        'customer_id': customer_id,
        'model_version': model_version,
        'prediction': prediction,
        'latency': latency,
        'timestamp': datetime.now().isoformat()
    })

    return jsonify({
        'prediction': prediction,
        'model_version': model_version,
        'request_id': str(uuid.uuid4())
    })

@app.route('/rollout/update', methods=['POST'])
def update_rollout():
    """Update rollout configuration"""
    data = request.json

    # Validate rollout percentage
    new_percentage = data.get('v2_percentage')
    if new_percentage and 0 <= new_percentage <= 100:
        router.rollout_config['v2_percentage'] = new_percentage

        # Log configuration change
        log_config_change({
            'action': 'rollout_update',
            'new_percentage': new_percentage,
            'timestamp': datetime.now().isoformat()
        })

        return jsonify({'status': 'success', 'new_config': router.rollout_config})

    return jsonify({'status': 'error', 'message': 'Invalid percentage'}), 400
```

### 7. Automated ML Pipeline

End-to-end automation with Apache Airflow.

```python
# Airflow DAG for ML Pipeline
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.kubernetes_pod import KubernetesPodOperator
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor
from datetime import datetime, timedelta

default_args = {
    'owner': 'ml-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'ml_training_pipeline',
    default_args=default_args,
    description='Automated ML training pipeline',
    schedule_interval='@daily',
    catchup=False
)

# Wait for new data
wait_for_data = S3KeySensor(
    task_id='wait_for_data',
    bucket_name='ml-data',
    bucket_key='raw/{{ ds }}/customer_data.csv',
    aws_conn_id='aws_default',
    timeout=18*60*60,
    poke_interval=300,
    dag=dag
)

# Data validation
validate_data = KubernetesPodOperator(
    task_id='validate_data',
    name='validate-data',
    namespace='ml-jobs',
    image='ml-pipeline:data-validator',
    arguments=[
        '--input-path', 's3://ml-data/raw/{{ ds }}/customer_data.csv',
        '--schema-path', 's3://ml-config/schemas/customer_schema.json'
    ],
    dag=dag
)

# Feature engineering
feature_engineering = KubernetesPodOperator(
    task_id='feature_engineering',
    name='feature-engineering',
    namespace='ml-jobs',
    image='ml-pipeline:feature-engineering',
    arguments=[
        '--input-path', 's3://ml-data/raw/{{ ds }}/customer_data.csv',
        '--output-path', 's3://ml-data/features/{{ ds }}/features.parquet'
    ],
    resources={
        'request_memory': '4Gi',
        'request_cpu': '2',
        'limit_memory': '8Gi',
        'limit_cpu': '4'
    },
    dag=dag
)

# Model training
model_training = KubernetesPodOperator(
    task_id='model_training',
    name='model-training',
    namespace='ml-jobs',
    image='ml-pipeline:model-training',
    arguments=[
        '--features-path', 's3://ml-data/features/{{ ds }}/features.parquet',
        '--model-type', 'xgboost',
        '--hyperparameter-tuning', 'true'
    ],
    resources={
        'request_memory': '8Gi',
        'request_cpu': '4',
        'limit_memory': '16Gi',
        'limit_cpu': '8',
        'limit_gpu': '1'
    },
    dag=dag
)

# Model evaluation
model_evaluation = KubernetesPodOperator(
    task_id='model_evaluation',
    name='model-evaluation',
    namespace='ml-jobs',
    image='ml-pipeline:model-evaluation',
    arguments=[
        '--model-path', 's3://ml-models/{{ run_id }}/model.pkl',
        '--test-data', 's3://ml-data/features/{{ ds }}/test_features.parquet',
        '--baseline-metrics', 's3://ml-metrics/baseline_metrics.json'
    ],
    dag=dag
)

# Deploy model if evaluation passes
deploy_model = KubernetesPodOperator(
    task_id='deploy_model',
    name='deploy-model',
    namespace='ml-jobs',
    image='ml-pipeline:model-deployer',
    arguments=[
        '--model-path', 's3://ml-models/{{ run_id }}/model.pkl',
        '--deployment-config', 's3://ml-config/deployment/production.yaml',
        '--canary-percentage', '10'
    ],
    dag=dag
)

# Define dependencies
wait_for_data >> validate_data >> feature_engineering >> model_training >> model_evaluation >> deploy_model
```

## Best Practices for Production MLOps

### 1. Version Everything

```yaml
# model_manifest.yaml
model:
  name: customer_churn_classifier
  version: 2.3.1
  framework: scikit-learn==1.2.0

training:
  data_version: v3.2.0
  code_version: git:8a3f2d1
  hyperparameters:
    n_estimators: 150
    max_depth: 12

dependencies:
  - pandas==1.5.3
  - numpy==1.24.2
  - scikit-learn==1.2.0

metrics:
  validation_auc: 0.892
  test_auc: 0.887
  training_date: 2024-01-15T10:30:00Z
```

### 2. Implement Comprehensive Testing

```python
# tests/test_model_quality.py
import pytest
from model import ChurnClassifier
import pandas as pd

class TestModelQuality:

    def test_prediction_range(self, trained_model, test_data):
        """Ensure predictions are in valid range"""
        predictions = trained_model.predict_proba(test_data)
        assert (predictions >= 0).all() and (predictions <= 1).all()

    def test_prediction_distribution(self, trained_model, test_data):
        """Check prediction distribution is reasonable"""
        predictions = trained_model.predict(test_data)
        churn_rate = predictions.mean()
        assert 0.05 <= churn_rate <= 0.30, f"Unusual churn rate: {churn_rate}"

    def test_feature_importance_stability(self, trained_model, previous_model):
        """Ensure feature importance doesn't change drastically"""
        current_importance = trained_model.feature_importances_
        previous_importance = previous_model.feature_importances_

        correlation = np.corrcoef(current_importance, previous_importance)[0, 1]
        assert correlation > 0.8, f"Feature importance correlation too low: {correlation}"

    def test_inference_latency(self, trained_model, test_data):
        """Ensure inference meets latency requirements"""
        import time

        sample = test_data.sample(100)
        start = time.time()
        _ = trained_model.predict(sample)
        latency = (time.time() - start) / 100

        assert latency < 0.01, f"Inference too slow: {latency}s per prediction"
```

### 3. Implement Model Governance

```python
# Model Registry with Governance
class ModelRegistry:
    def __init__(self):
        self.approved_models = {}
        self.pending_approval = {}

    def submit_model(self, model_metadata):
        """Submit model for approval"""
        model_id = f"{model_metadata['name']}:{model_metadata['version']}"

        # Automated checks
        checks = {
            'performance': self._check_performance(model_metadata),
            'bias': self._check_bias(model_metadata),
            'security': self._check_security(model_metadata),
            'compliance': self._check_compliance(model_metadata)
        }

        if all(checks.values()):
            # Auto-approve if all checks pass
            self.approved_models[model_id] = {
                **model_metadata,
                'approval_date': datetime.now(),
                'checks': checks
            }
            return {'status': 'approved', 'model_id': model_id}
        else:
            # Require manual review
            self.pending_approval[model_id] = {
                **model_metadata,
                'checks': checks,
                'submitted_date': datetime.now()
            }
            return {'status': 'pending', 'model_id': model_id, 'failed_checks': [k for k, v in checks.items() if not v]}
```

## Conclusion

MLOps is essential for successfully deploying and maintaining ML models in production. Key takeaways:

1. **Automate Everything**: From data validation to model deployment
2. **Version Religiously**: Track data, code, models, and configurations
3. **Monitor Continuously**: Watch for drift, degradation, and anomalies
4. **Test Comprehensively**: Unit tests, integration tests, and ML-specific tests
5. **Deploy Gradually**: Use canary deployments and A/B testing
6. **Govern Properly**: Implement checks for bias, compliance, and security

The tools and practices we've covered form the foundation of a robust MLOps platform. As ML becomes increasingly critical to business operations, investing in proper MLOps infrastructure is no longer optional—it's essential for maintaining competitive advantage while ensuring reliability, compliance, and scalability.
