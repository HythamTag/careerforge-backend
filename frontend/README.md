# CV Enhancer Frontend

Modern React frontend for the CV Enhancer application, built with Vite and Tailwind CSS.

## Features

- 🚀 **Fast Development** - Vite for instant HMR
- 🎨 **Modern UI** - Tailwind CSS for beautiful, responsive design
- 📤 **CV Upload** - Drag & drop file upload with progress tracking
- 📊 **Real-time Status** - Live updates on CV processing status
- 👁️ **CV Viewer** - View parsed CV data in a clean, organized format
- ✨ **ATS Optimization** - Optimize CVs for Applicant Tracking Systems
- 📈 **ATS Scoring** - Get detailed compatibility scores and recommendations
- 📥 **Download** - Download optimized CVs in PDF or DOCX format

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:5000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── UploadCV.jsx     # CV upload with drag & drop
│   │   ├── CVStatus.jsx     # Real-time status tracking
│   │   ├── CVView.jsx       # CV data display
│   │   ├── OptimizeCV.jsx  # ATS optimization form
│   │   └── ATSScore.jsx     # ATS scoring display
│   ├── services/            # API service layer
│   │   └── api.js           # Backend API client
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles & Tailwind
├── public/                  # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── postcss.config.js       # PostCSS config
├── .eslintrc.cjs          # ESLint configuration
├── .prettierrc            # Prettier configuration
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## API Integration

The frontend communicates with the backend API through the `api.js` service layer:

- `POST /api/cv/upload` - Upload CV
- `GET /api/cv/:id/status` - Get processing status
- `GET /api/cv/:id` - Get parsed CV data
- `POST /api/cv/:id/optimize` - Optimize CV
- `GET /api/cv/:id/download?format=pdf|docx` - Download CV
- `GET /api/cv/:id/ats-score` - Get ATS score

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

## Features

### Upload CV
- Drag & drop file upload
- PDF file validation
- File size checking (max 10MB)
- Real-time upload progress

### CV Status
- Real-time status polling
- Progress bar visualization
- Error handling and display

### CV View
- Structured data display
- Personal information
- Experience, Education, Skills
- Download options (PDF/DOCX)

### Optimize CV
- Target role input
- Optional job description
- ATS optimization trigger
- Status tracking

### ATS Score
- Compatibility score (0-100)
- Score breakdown by category
- Recommendations
- Missing keywords highlight

## Technologies

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Dropzone** - File upload component

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC
