import cv2
import numpy as np
# Імітація TensorFlow Lite моделі
class TFLiteModel:
    def predict(self, img): return {"anomaly": "Хвороба", "confidence": 0.95}

model = TFLiteModel()

def calculate_ndvi(nir, red):
    return (nir - red) / (nir + red + 1e-6)

# Симуляція даних з MicaSense RedEdge-P
nir = np.random.uniform(0.4, 1.0,(100,100))
red = np.random.uniform(0.1,0.4,(100,100))
ndvi = calculate_ndvi(nir, red)
anomalies = model.predict(ndvi)

print(f"NDVI: {ndvi.mean():.3f}, Аномалія: {anomalies['anomaly']} ({anomalies['confidence']*100:.1f}%)")