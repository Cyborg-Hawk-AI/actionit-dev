# Action.IT - AI-Powered Meeting Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-orange.svg)](https://vitejs.dev/)

> **Next-generation AI-powered meeting assistant** with calendar integration, real-time transcription, and intelligent insights.

## 🚀 Features

### **🤖 AI-Powered Intelligence**
- **Real-time transcription** with Recall.ai integration
- **Smart meeting insights** and key point extraction
- **Action item detection** and task assignment
- **Speaker identification** and sentiment analysis
- **Meeting summaries** with AI-generated highlights

### **📅 Calendar Integration**
- **Google Calendar** seamless integration
- **Microsoft Calendar** support
- **Multi-calendar management** with sync
- **Meeting scheduling** with bot automation
- **Real-time calendar updates**

### **🎯 Smart Meeting Management**
- **Auto-join meetings** with bot assistance
- **Meeting recording** and transcription
- **Live meeting insights** during calls
- **Post-meeting analytics** and reports
- **Meeting templates** and recurring setup

### **💼 Enterprise Features**
- **Team collaboration** tools
- **Advanced security** and compliance
- **Analytics dashboard** with insights
- **Custom integrations** and APIs
- **Scalable architecture**

## 🏗️ Architecture

### **Frontend Stack**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **React Router** for navigation

### **Backend Services**
- **Supabase** for database and authentication
- **Google Calendar API** integration
- **Recall.ai** for transcription
- **OpenAI** for AI insights
- **Edge Functions** for serverless operations

### **Key Components**
```
src/
├── components/          # UI Components
│   ├── calendar/       # Calendar views and management
│   ├── dashboard/      # Dashboard components
│   └── ui/            # Reusable UI components
├── pages/              # Application pages
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── context/            # React context providers
└── integrations/       # Third-party integrations
```

## 🛠️ Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Calendar API credentials
- Recall.ai account

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/Cyborg-Hawk-AI/actionit-dev.git
cd actionit-dev
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Configure your environment**
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Calendar API
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Recall.ai Integration
VITE_RECALL_API_KEY=your_recall_api_key

# OpenAI for Insights
VITE_OPENAI_API_KEY=your_openai_api_key
```

5. **Start development server**
```bash
npm run dev
```

6. **Build for production**
```bash
npm run build
```

## 🔧 Configuration

### **Supabase Setup**
1. Create a new Supabase project
2. Set up authentication with Google OAuth
3. Configure database tables and functions
4. Set up Edge Functions for calendar sync

### **Google Calendar Integration**
1. Create Google Cloud project
2. Enable Calendar API
3. Configure OAuth 2.0 credentials
4. Set up webhook endpoints

### **Recall.ai Setup**
1. Create Recall.ai account
2. Configure webhook endpoints
3. Set up transcription processing
4. Configure AI insights generation

## 📊 Dashboard Features

### **Smart Overview**
- **Today's meetings** with countdown timers
- **Weekly progress** tracking
- **AI insights** summary
- **Next meeting** countdown

### **Calendar Management**
- **Day/Week/Month** calendar views
- **Meeting creation** and editing
- **Bot integration** for auto-join
- **Real-time sync** with calendars

### **Meeting Intelligence**
- **Live transcription** display
- **Key insights** extraction
- **Action items** tracking
- **Speaker analytics**

## 🧪 Testing

### **Run Test Suite**
```bash
# Run all tests
node test-scripts/run-all-tests.js

# Individual tests
node test-scripts/create-test-user.js
node test-scripts/test-auth-flow.js
node test-scripts/check-real-data.js
```

### **Development Testing**
```bash
# Test user credentials
Email: test@action.it
Password: testpassword123
```

## 🚀 Deployment

### **Vercel Deployment**
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### **Netlify Deployment**
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Configure environment variables

### **Docker Deployment**
```bash
# Build Docker image
docker build -t actionit .

# Run container
docker run -p 3000:3000 actionit
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```
3. **Commit your changes**
```bash
git commit -m 'Add amazing feature'
```
4. **Push to the branch**
```bash
git push origin feature/amazing-feature
```
5. **Open a Pull Request**

## 📝 Development Workflow

### **Code Standards**
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Conventional commits** for versioning

### **Testing Strategy**
- **Unit tests** for components
- **Integration tests** for APIs
- **E2E tests** for user flows
- **Performance testing** for optimization

## 🔒 Security

### **Authentication**
- **Supabase Auth** with OAuth providers
- **JWT tokens** for session management
- **Role-based access** control
- **Secure API endpoints**

### **Data Protection**
- **Encrypted data** storage
- **GDPR compliance** features
- **Privacy controls** for users
- **Secure API** communications

## 📈 Performance

### **Optimizations**
- **Code splitting** with dynamic imports
- **Lazy loading** for components
- **Image optimization** and compression
- **Caching strategies** for API calls

### **Monitoring**
- **Google Analytics** integration
- **Error tracking** and reporting
- **Performance monitoring**
- **User analytics** and insights

## 🎯 Roadmap

### **Phase 1: Core Features** ✅
- [x] Calendar integration
- [x] Meeting management
- [x] AI transcription
- [x] Basic insights

### **Phase 2: Advanced AI** 🚧
- [ ] Live transcription display
- [ ] Advanced speaker identification
- [ ] Meeting sentiment analysis
- [ ] Predictive analytics

### **Phase 3: Enterprise** 📋
- [ ] Video calling integration
- [ ] Screen sharing capabilities
- [ ] Team collaboration tools
- [ ] Advanced security features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for backend services
- **Recall.ai** for transcription
- **OpenAI** for AI insights
- **Shadcn/ui** for components
- **Vite** for build tooling

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Cyborg-Hawk-AI/actionit-dev/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Cyborg-Hawk-AI/actionit-dev/discussions)

---

**Built with ❤️ by the Action.IT team**

*Empowering meetings with AI intelligence*
