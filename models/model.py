import numpy as np

class TextDetector:
    def __init__(self):
        print("Text detector initialized")

    def predict(self, image_region):
        avg = np.mean(image_region)
        if avg < 85:
            return "No text detected"
        elif avg < 170:
            return "Sample Text A"
        else:
            return "Sample Text B"
