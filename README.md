# 🌍 Earth Condition Simulator

An interactive, high-fidelity browser-based simulator that puts the fate of our planet in your hands. Adjust environmental factors in real-time and witness the immediate visual and biological consequences on a global scale.

## 🚀 What I Built
I built an interactive climate model and survival simulator. Users control six critical environmental sliders—**Temperature, Sea Level, Forest Cover, Pollution, Ice Caps, and Clean Energy**—to observe their real-time impact on Earth's vitality. 

The project features a custom-rendered SVG globe that reacts visually to your settings (melting ice caps, toxic oceans, spreading smog) and includes a professional-grade simulation engine that projects human population changes over a 10-year period based on your ecological choices.

## 🔗 Demo
[Live Demo →](https://rohan-shridhar.github.io/earth/)

## ✨ Features
- **Animated SVG Earth**: A custom-built globe with organic bezier-path continents and real-time visual updates.
- **6-Axis Environmental Control**: Fine-tuned sliders for a wide range of climate scenarios.
- **Live Earth Health Score**: A unified 0–1000 vitality meter with reactive status labels.
- **Real-time Population Ticker**: A live, frame-by-frame world population counter (8.2B baseline) that reacts to current planetary health.
- **Dynamic Visual Effects**: Atmospheric glows, toxic smog overlays, forest fire particles, and seasonal ice cap melting.
- **10-Year Future Projection**: A simulation engine with a year-by-year breakdown and color-coded survival verdicts.
- **Premium Sci-Fi UI**: A polished, space-themed interface using Google Fonts (Orbitron & Space Mono).
- **Zero Dependencies**: Built with pure Vanilla JS/HTML/CSS—no frameworks, no libraries, just code.

## 🛠 How I Built It
This project was built using the **Antigravity** vibe coding tool, focusing on a "Single File" architecture for maximum portability and performance.
- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism, custom animations).
- **Graphics**: Interactive SVG manipulation using `requestAnimationFrame` for buttery-smooth 60fps visuals.
- **Logic**: Custom simulation math for environmental penalties and population growth.
- **No Frameworks**: 100% dependency-free.

## 🧠 Challenges
- **SVG Realism**: Achieving an "earth-like" look using only SVG paths and gradients was a major design challenge, requiring complex bezier math for organic-looking continents.
- **Balancing the Math**: Tuning the 10-year simulation so it feels scientifically plausible while remaining engaging and impactful for a user.
- **Single-Source Performance**: Keeping the entire logic (visuals, simulation, and state) performant and clean without the help of external state management libraries.

## 🏆 DEV Challenge Category
**Best Use of Google Gemini** (Built using Antigravity powered by Gemini 2.0 Pro)

---
*Built for the Planet · Earth Day 2026*
