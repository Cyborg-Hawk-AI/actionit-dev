import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
const PrivacyPolicy: React.FC = () => {

  const content = `# Privacy Policy

**Last updated:** January 1, 2024

## 1. Introduction

Action.IT ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered meeting assistant service.

## 2. Information We Collect

### 2.1 Personal Information
- **Account Information:** Name, email address, profile photo
- **Calendar Data:** Meeting schedules, attendee information, meeting titles
- **Authentication Data:** Login credentials and session information

### 2.2 Meeting Content
- **Audio Recordings:** Meeting audio when you use our recording feature
- **Transcriptions:** AI-generated transcripts of your meetings
- **Meeting Metadata:** Date, time, duration, and participant information
- **Generated Insights:** AI-created summaries, action items, and analysis

### 2.3 Technical Information
- **Device Information:** Browser type, operating system, device identifiers
- **Usage Data:** Features used, time spent, interaction patterns
- **Log Data:** IP addresses, access times, error logs

### 2.4 Third-Party Integrations
- **Calendar Services:** Data from Google Calendar, Microsoft Outlook
- **Video Platforms:** Meeting URLs and metadata from Zoom, Teams, etc.

## 3. How We Use Your Information

### 3.1 Service Provision
- Transcribe and analyze your meetings
- Generate AI-powered summaries and insights
- Sync with your calendar applications
- Provide meeting recordings and playback

### 3.2 Service Improvement
- Enhance AI accuracy and features
- Develop new functionality
- Analyze usage patterns for optimization
- Troubleshoot technical issues

### 3.3 Communication
- Send service notifications and updates
- Provide customer support
- Share important policy changes
- Marketing communications (with consent)

## 4. Information Sharing and Disclosure

### 4.1 We Do Not Sell Your Data
We never sell, rent, or trade your personal information or meeting content to third parties for marketing purposes.

### 4.2 Limited Sharing
We may share information only in these circumstances:
- **Service Providers:** Trusted vendors who help operate our service
- **Legal Requirements:** When required by law or to protect rights
- **Business Transfers:** In case of merger, acquisition, or sale
- **Your Consent:** When you explicitly authorize sharing

### 4.3 Meeting Participants
- Meeting transcripts and summaries may be shared with other meeting participants
- You control what information is shared through meeting settings
- Participants can access content from meetings they attended

## 5. Data Security

### 5.1 Security Measures
- **Encryption:** All data is encrypted in transit and at rest
- **Access Controls:** Strict employee access limitations
- **Regular Audits:** Security assessments and penetration testing
- **Secure Infrastructure:** Industry-standard cloud security practices

### 5.2 Data Retention
- **Meeting Content:** Retained according to your subscription plan
- **Account Data:** Kept until account deletion
- **Legal Compliance:** Some data may be retained for legal requirements
- **Backup Data:** Securely deleted according to our retention schedule

## 6. Your Rights and Choices

### 6.1 Access and Control
- **View Your Data:** Access all personal information we have
- **Update Information:** Correct or update your account details
- **Delete Data:** Request deletion of your personal information
- **Data Portability:** Export your data in standard formats

### 6.2 Privacy Settings
- **Recording Controls:** Choose when meetings are recorded
- **Sharing Preferences:** Control who can access your content
- **Notification Settings:** Manage communication preferences
- **Integration Controls:** Manage third-party connections

### 6.3 Marketing Communications
- **Opt-Out:** Unsubscribe from marketing emails anytime
- **Preferences:** Choose types of communications you receive
- **Do Not Track:** We respect browser do-not-track settings

## 7. Cookies and Tracking

### 7.1 Types of Cookies
- **Essential Cookies:** Required for service functionality
- **Analytics Cookies:** Help us understand usage patterns
- **Preference Cookies:** Remember your settings and choices

### 7.2 Cookie Management
- Most browsers allow you to control cookies
- Disabling essential cookies may limit functionality
- We provide cookie preference controls in our service

## 8. International Data Transfers

- Your data may be processed in countries other than your own
- We ensure adequate protection through standard contractual clauses
- Data transfers comply with applicable privacy laws

## 9. Children's Privacy

- Our service is not intended for children under 18
- We do not knowingly collect children's personal information
- If we discover child data, we will delete it promptly

## 10. Changes to This Policy

- We may update this Privacy Policy periodically
- Material changes will be notified via email or service notification
- The "Last updated" date reflects the most recent version
- Continued use constitutes acceptance of changes

## 11. Regional Privacy Rights

### 11.1 GDPR (European Union)
If you're in the EU, you have additional rights including:
- Right to be forgotten
- Data portability
- Object to processing
- Withdraw consent

### 11.2 CCPA (California)
California residents have rights to:
- Know what personal information is collected
- Delete personal information
- Opt-out of sale (though we don't sell data)
- Non-discrimination for exercising rights

## 12. Contact Us

For privacy questions or to exercise your rights, contact us at:

**Email:** privacy@action.it
**Address:** [Your Business Address]
**Response Time:** We respond to privacy requests within 30 days

---

*This policy is effective as of the last updated date above.*`;

  const parseMarkdown = (markdown: string) => {
    return markdown
      .replace(/^# (.*$)/gm, '<h1 class="text-4xl font-bold mb-8 text-foreground sf-display">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-6 mt-8 text-foreground sf-display">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-4 mt-6 text-foreground sf-display">$1</h3>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/^- (.*$)/gm, '<li class="mb-2 text-muted-foreground sf-text">$1</li>')
      .replace(/^([^<#\-\*\n].*$)/gm, '<p class="mb-4 text-muted-foreground sf-text leading-relaxed">$1</p>')
      .replace(/(<li.*<\/li>)/gs, '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>')
      .replace(/<\/ul>\s*<ul[^>]*>/g, '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/20">
      {/* Header */}
      <header className="w-full py-6 px-8 backdrop-blur-sm border-b border-border/20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4">
            <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-2 overflow-hidden">
              <img 
                src="/lovable-uploads/bc71da7b-c851-4555-a84a-74eddc25384a.png" 
                alt="Action.IT Logo" 
                className="w-8 h-8 object-contain" 
              />
            </div>
            <span className="sf-display text-2xl text-foreground tracking-tight">Action.IT</span>
          </Link>
          <Button variant="outline" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-8 py-12">
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
        />
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <p className="sf-text text-muted-foreground text-sm">
            © 2024 Action.IT. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
