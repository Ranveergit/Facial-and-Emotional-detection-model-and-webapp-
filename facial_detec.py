import numpy as np
import os
import cv2
from keras.models import Sequential
from keras.layers import Conv2D, MaxPooling2D
from keras.layers import Activation, Dropout, Flatten, Dense
from keras.optimizers import Adam
from sklearn.model_selection import train_test_split

# Step 1: Load and Preprocess the Custom Dataset
data_dir = r'C:\Users\Aryan Yadav\OneDrive\Desktop\dataset\face_data_2023_mini_project\face_recognitation'
face_labels = ['Al-Faiz_Ali', 'Aryan', 'divyanshu', 'jayanta', 'Ranveer', 'Riktom', 'sai_dushwanth','Tejas','unknown']
num_classes = len(face_labels)

# Initialize empty lists to store images and labels
images = []
labels = []

for face_label in face_labels:
    face_dir = os.path.join(data_dir, face_label)

    for image_filename in os.listdir(face_dir):
        image_path = os.path.join(face_dir, image_filename)
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)  # Load images in grayscale
        image = cv2.resize(image, (48, 48))  # Resize images to a common size
        images.append(image)
        labels.append(face_labels.index(face_label))

# Normalize images and convert to numpy arrays
images = np.array(images, dtype='float32') / 255.0
labels = np.array(labels)

# Step 2: Split the Data into Training and Testing Sets
X_train, X_test, y_train, y_test = train_test_split(images, labels, test_size=0.2, random_state=42)

# Step 3: Build the Model
model = Sequential()

model.add(Conv2D(32, (3, 3), input_shape=(48, 48, 1), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))

model.add(Conv2D(64, (3, 3), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))

model.add(Flatten())
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.5))
model.add(Dense(num_classes, activation='softmax'))

# Step 4: Compile the Modelq
model.compile(loss='sparse_categorical_crossentropy', optimizer=Adam(learning_rate=0.001), metrics=['accuracy'])

# Step 5: Model Training
batch_size = 64
epochs = 20

model.fit(X_train, y_train, validation_data=(X_test, y_test), batch_size=batch_size, epochs=epochs)

# Step 6: Model Evaluation
loss, accuracy = model.evaluate(X_test, y_test)
print(f"Test Loss: {loss}, Test Accuracy: {accuracy}")

# Step 7: Inference
# You can use the trained model for emotion detection on new images

# Save the model
model.save('face_detection_model.h5')
