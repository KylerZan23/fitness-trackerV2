#!/bin/bash

# Create public directory if it doesn't exist
mkdir -p public

# Download images from Unsplash
# Using specific image IDs for consistent, high-quality images

# Hero background - Dramatic gym/workout scene
curl -L "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80" -o "public/hero-bg.jpg"

# Login background - Person working out in dark setting
curl -L "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1920&q=80" -o "public/login-bg.jpg"

# Signup background - Dynamic fitness scene
curl -L "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=80" -o "public/signup-bg.jpg"

# Signup success background - Celebratory fitness image
curl -L "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=1920&q=80" -o "public/signup-success-bg.jpg"

echo "Images downloaded successfully!" 