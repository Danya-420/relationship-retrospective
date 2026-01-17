# Relationship Retrospective

An emotive, minimalist web application designed to help individuals reflect on and find closure for past relationships. Featuring a guided wizard, an interactive memory gallery, and a thoughtful termination sequence, it provides a safe space for introspection.

## ✨ Features

- **Guided Reflection Wizard:** A multi-step process covering various aspects of a relationship, from timelines to emotional growth.
- **Interactive Memory Stack:** A visual "stacked-photo" gallery of shared moments that can be revisited one by one.
- **Closure Sequence:** A final "Walk Away" flow designed to offer peace and a sense of completion.
- **Persistence:** Built-in mechanism to save progress locally, ensuring your reflections aren't lost.
- **Responsive Design:** A premium, mobile-friendly interface with smooth animations and a soft aesthetic.

## 🛠️ Tech Stack

- **Frontend:** React with Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Backend:** Node.js & Express (used for supplementary features like PDF generation/email notifications)
- **Deployment:** Render (configured for both frontend and backend)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/relationship-retrospective.git
    cd relationship-retrospective
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add any necessary configuration (e.g., mail server settings if using NodeMailer).

### Running Locally

To start the development server:

```bash
npm run dev
```

To run the backend server separately:

```bash
node server.js
```

### Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory.

## 📜 License

This project is licensed under the ISC License.
