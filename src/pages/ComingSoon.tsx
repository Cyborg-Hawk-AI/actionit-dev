import React, { useState } from 'react';
import { Mail, Calendar, Bot, Shield, Zap, Users, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

const ComingSoon = () => {
  useGoogleAnalytics();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    if (!validateEmail(trimmedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('email_waitlist')
        .insert([{ email: trimmedEmail }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already on the list!",
            description: "This email is already registered for early access.",
          });
        } else {
          console.error('Error inserting email:', error);
          toast({
            title: "Something went wrong",
            description: "Please try again later.",
            variant: "destructive"
          });
        }
      } else {
        setIsSubmitted(true);
        toast({
          title: "You're on the list!",
          description: "We'll notify you when Action.IT launches with your free month.",
        });
        setEmail('');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI-Enhanced Summaries",
      description: "Intelligent meeting insights that understand context, decisions, and action items automatically."
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Multi-Calendar Sync",
      description: "Seamless integration with Google, Outlook, and Teams calendars. One dashboard, all your meetings."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Privacy",
      description: "Local/offline model options, encrypted storage, and SOC 2 compliance for enterprise security."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Smart Bot Joins",
      description: "Configurable meeting bot that joins only when needed, with audio-only or full A/V options."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Speaker Intelligence",
      description: "Advanced speaker identification and sentiment analysis for deeper meeting insights."
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Platform Integrations",
      description: "Coming soon: Slack exports, Notion sync, and seamless workflow integrations."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="relative z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg sf-display">A</span>
          </div>
          <span className="text-xl font-semibold sf-display">Action.IT</span>
        </div>
        <ThemeToggle variant="icon" />
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-teal-50/30 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-teal-950/20" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-8 animate-fade-in">
            <Zap className="h-4 w-4" />
            Coming Soon - Built by Engineers, for Teams Who Move Fast
          </div>
          
          <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 sf-display animate-slide-up">
            AI-Powered Meeting
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-600 to-teal-600 bg-clip-text text-transparent">
              Intelligence
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Summarize what matters. Ignore what doesn't.
            <br />
            Privacy-first. Insight-driven.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <form onSubmit={handleEmailSubmit} className="flex gap-2 w-full max-w-md">
              <Input
                type="email"
                placeholder="Enter your email for early access"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
                disabled={isSubmitting}
              />
              <Button type="submit" className="flex items-center gap-2" disabled={isSubmitting}>
                {isSubmitted ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                {isSubmitting ? 'Adding...' : isSubmitted ? 'Added!' : 'Notify Me'}
              </Button>
            </form>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Get notified when we launch + receive 1 month free
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium mb-4 sf-display">
              Beyond Traditional Meeting Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've solved what Otter.AI and others haven't: true intelligence, enterprise security, and seamless workflow integration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} variant="apple" className="group hover:scale-[1.02] transition-all duration-300 interactive-element">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-medium mb-3 sf-display">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Section */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium mb-6 sf-display">
            Backed by Real Engineering
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Built on React, TypeScript, and Supabase with enterprise-grade infrastructure. 
            OpenAI and DeepSeek integration for advanced AI analysis. Local model support for maximum privacy.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">SOC 2</div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">&lt;2s</div>
              <div className="text-sm text-muted-foreground">AI Response</div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="px-3 py-1 bg-muted rounded-full">Google Meet</span>
            <span className="px-3 py-1 bg-muted rounded-full">Microsoft Teams</span>
            <span className="px-3 py-1 bg-muted rounded-full">Zoom</span>
            <span className="px-3 py-1 bg-muted rounded-full">Google Calendar</span>
            <span className="px-3 py-1 bg-muted rounded-full">Outlook</span>
            <span className="px-3 py-1 bg-muted rounded-full">Slack</span>
            <span className="px-3 py-1 bg-muted rounded-full">Notion</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border/40">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg sf-display">A</span>
            </div>
            <span className="text-xl font-semibold sf-display">Action.IT</span>
          </div>
          
          <p className="text-muted-foreground mb-6">
            The next-generation AI meeting assistant for teams who move fast.
          </p>
          
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <a href="mailto:Info@ActionIT.AI" className="hover:text-foreground transition-colors">
              Contact
            </a>
            {/* <a href="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/TOS" className="hover:text-foreground transition-colors">
              Terms
            </a> */}
          </div>
          
          <div className="mt-8 text-xs text-muted-foreground">
            © 2024 Action.IT All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoon;
