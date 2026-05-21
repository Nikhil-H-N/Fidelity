import { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  Calculator,
  FileText,
  MessageCircle,
  Phone,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import apiClient from '../../api/client';
import { getLastInteractionContext, queueEvent } from '../../api/eventService';

const quickPrompts = [
  { label: 'Best plan', prompt: 'Which plan fits me?' },
  { label: 'Risk', prompt: 'Explain the risk' },
  { label: 'Returns', prompt: 'Estimate returns for this option' },
  { label: 'Tax', prompt: 'How can I save tax?' },
  { label: 'Insurance', prompt: 'Do I need insurance first?' },
  { label: 'Retirement', prompt: 'Help me plan retirement' },
  { label: 'Documents', prompt: 'What documents are needed?' },
  { label: 'Checkout', prompt: 'Help me finish checkout' },
];

const actionOptions = [
  { label: 'Compare', icon: Scale, route: '/plan-comparison', event: 'comparison', metadata: { source: 'chatbot_action' } },
  { label: 'Calculator', icon: Calculator, route: '/investment-calculator', event: 'calculator_usage', metadata: { calculator: 'chatbot_selected', source: 'chatbot_action' } },
  { label: 'Apply', icon: FileText, route: '/checkout/wealth-core', event: 'checkout_start', metadata: { source: 'chatbot_action' } },
  { label: 'Advisor', icon: Phone, route: null, event: 'contact_advisor', metadata: { source: 'chatbot_action' } },
];

const getContext = (pathname) => {
  if (pathname.includes('sip')) {
    return {
      product: 'SIP',
      route: '/investment-calculator',
      checkoutRoute: '/checkout/wealth-core',
      riskHint: 'market-linked, suitable for long-term disciplined investing',
    };
  }
  if (pathname.includes('insurance')) {
    return {
      product: 'Insurance',
      route: '/know-more/term-life',
      checkoutRoute: '/checkout/term-life',
      riskHint: 'protection-first, designed to reduce family financial risk',
    };
  }
  if (pathname.includes('retirement')) {
    return {
      product: 'Retirement',
      route: '/retirement-planning',
      checkoutRoute: '/checkout/wealth-core',
      riskHint: 'long-horizon, best reviewed by age, savings, and monthly contribution',
    };
  }
  if (pathname.includes('tax')) {
    return {
      product: 'Tax Saver',
      route: '/know-more/elss-tax-saver',
      checkoutRoute: '/checkout/elss-tax-saver',
      riskHint: 'equity-linked with tax benefits and a lock-in period',
    };
  }
  if (pathname.includes('wealth')) {
    return {
      product: 'Wealth Core',
      route: '/know-more/wealth-core',
      checkoutRoute: '/checkout/wealth-core',
      riskHint: 'portfolio-based, matched to goals and risk appetite',
    };
  }
  return {
    product: 'FinovaWealth',
    route: '/plan-comparison',
    checkoutRoute: '/checkout/wealth-core',
    riskHint: 'personalized after comparing goals, risk, tax, and time horizon',
  };
};

const makeReply = (prompt, context) => {
  const text = prompt.toLowerCase();
  if (text.includes('tax') || text.includes('80c') || text.includes('elss')) {
    return {
      intent: 'tax_guidance',
      route: '/know-more/elss-tax-saver',
      text: 'For tax saving, ELSS can help under Section 80C while keeping growth potential. If you want lower risk, compare it against insurance, PPF-style options, and retirement contributions before applying.',
    };
  }
  if (text.includes('insurance') || text.includes('cover') || text.includes('protection')) {
    return {
      intent: 'insurance_guidance',
      route: '/know-more/term-life',
      text: 'Insurance should usually come before aggressive investing if family protection is underfunded. Start with term cover, then use SIP or ELSS for wealth and tax goals.',
    };
  }
  if (text.includes('retirement')) {
    return {
      intent: 'retirement_guidance',
      route: '/retirement-planning',
      text: 'For retirement, the important signals are current age, target age, existing savings, and monthly investment. Use the retirement calculator, then continue to a matched wealth plan.',
    };
  }
  if (text.includes('return') || text.includes('calculator') || text.includes('growth')) {
    return {
      intent: 'returns_guidance',
      route: '/investment-calculator',
      text: `Use the return calculator for a clean projection. For ${context.product}, compare invested amount, expected return, and time horizon before choosing a plan.`,
    };
  }
  if (text.includes('document') || text.includes('kyc') || text.includes('pan')) {
    return {
      intent: 'document_guidance',
      route: context.checkoutRoute,
      text: 'For the application, keep PAN, phone, email, nominee details, income range, and risk profile ready. The form tracks validation errors so the recovery engine knows where users get stuck.',
    };
  }
  if (text.includes('advisor') || text.includes('call') || text.includes('help me')) {
    return {
      intent: 'advisor_request',
      route: null,
      text: 'I can mark this as an advisor-contact signal. In the admin console, that becomes a high-intent event for manual follow-up or targeted notification.',
    };
  }
  if (text.includes('risk')) {
    return {
      intent: 'risk_explanation',
      route: '/plan-comparison',
      text: `${context.product} is ${context.riskHint}. Conservative users should compare protection and stable-return options, while aggressive users can review ELSS, SIP, and wealth portfolios.`,
    };
  }
  if (text.includes('checkout') || text.includes('finish')) {
    return {
      intent: 'checkout_recovery',
      route: context.checkoutRoute,
      text: 'You are close to conversion. I can take you to the application and preserve the behavior trail for a recovery nudge if you stop midway.',
    };
  }
  if (text.includes('plan') || text.includes('fit') || text.includes('best')) {
    return {
      intent: 'plan_match',
      route: context.route,
      text: `Based on the current page, start with ${context.product}, then compare it against tax saving, insurance, SIP, and retirement alternatives before applying.`,
    };
  }
  return {
    intent: 'general_guidance',
    route: context.route,
    text: 'I can help compare plans, explain risk, calculate returns, prepare documents, request advisor help, or continue your application from the current journey.',
  };
};

const describeLastInteraction = (interaction) => {
  if (!interaction) return null;
  const page = String(interaction.page || 'this page').replace(/^\//, '').replace(/-/g, ' ');
  const target = interaction.product || interaction.form || interaction.element;

  if (interaction.eventType === 'form_abandon' || interaction.eventType === 'checkout_abandon') {
    return `You left ${target || 'a form'} at ${interaction.completion || 0}% completion on ${page}. I can help you finish it.`;
  }
  if (interaction.eventType === 'form_progress') {
    return `You were ${interaction.completion || 0}% through ${target || 'a form'} on ${page}.`;
  }
  if (interaction.eventType === 'form_submit' || interaction.eventType === 'checkout_complete') {
    return `You completed ${target || 'a form'} on ${page}. I can suggest the next best step.`;
  }
  if (interaction.eventType === 'button_click' || interaction.eventType === 'cta_click') {
    return `Your last action was clicking ${target || 'an option'} on ${page}.`;
  }
  return `You were last exploring ${target || page}.`;
};

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(getLastInteractionContext);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi, I am Finova AI. I can guide plans, risk, and recovery nudges.' },
  ]);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const navigate = useNavigate();
  const context = useMemo(() => getContext(location.pathname), [location.pathname]);

  const toggleOpen = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      const latestInteraction = getLastInteractionContext();
      setLastInteraction(latestInteraction);
      const contextText = describeLastInteraction(latestInteraction);

      if (contextText) {
        setMessages((current) => {
          const contextId = `${latestInteraction.eventType}-${latestInteraction.timestamp}`;
          if (current.some((message) => message.contextId === contextId)) return current;
          return [
            ...current,
            { role: 'assistant', text: contextText, route: context.checkoutRoute, contextId },
          ];
        });
      }

      queueEvent({
        eventType: 'chatbot_open',
        page: location.pathname,
        metadata: { contextProduct: context.product, lastInteraction: latestInteraction },
      });
    }
  };

  const sendMessage = async (text = input) => {
    const prompt = text.trim();
    if (!prompt || sending) return;

    const fallbackReply = makeReply(prompt, context);
    const userMessage = { role: 'user', text: prompt };
    setSending(true);
    setMessages((current) => [
      ...current,
      userMessage,
      { role: 'assistant', text: 'Thinking with the live AI model...', pending: true },
    ]);
    setInput('');

    let reply = fallbackReply;
    let provider = 'fallback';
    try {
      const response = await apiClient.post('/ai/chat', {
        prompt,
        context: {
          ...context,
          pathname: location.pathname,
        },
        lastInteraction,
        history: messages,
      });

      const llmReply = response.data?.data;
      if (llmReply?.text) {
        reply = {
          intent: llmReply.intent || fallbackReply.intent,
          route: llmReply.route || fallbackReply.route,
          text: llmReply.text,
        };
        provider = response.data?.provider || 'llm';
      }
    } catch (error) {
      console.warn('LLM chatbot unavailable, using local fallback:', error.message);
    }

    setMessages((current) => {
      const idx = current.findLastIndex((message) => message.pending);
      if (idx !== -1) {
        return [...current.slice(0, idx), { role: 'assistant', text: reply.text, route: reply.route }];
      }
      return [...current, { role: 'assistant', text: reply.text, route: reply.route }];
    });
    setSending(false);

    queueEvent({
      eventType: 'chatbot_message',
      page: location.pathname,
        metadata: {
          prompt,
          reply: reply.text,
          intent: reply.intent,
          suggestedRoute: reply.route,
          contextProduct: context.product,
          lastInteraction,
          provider,
        },
      });
  };

  const recommend = (route = context.route, reason = 'primary_recommendation') => {
    queueEvent({
      eventType: 'chatbot_recommendation',
      page: location.pathname,
      metadata: { recommendationRoute: route, reason, contextProduct: context.product },
    });
    navigate(route);
  };

  const handleAction = (action) => {
    queueEvent({
      eventType: action.event,
      page: location.pathname,
      metadata: {
        ...action.metadata,
        contextProduct: context.product,
        actionLabel: action.label,
      },
    });

    if (action.route) {
      recommend(action.route, `action_${action.label.toLowerCase()}`);
      return;
    }

    setMessages((current) => [
      ...current,
      { role: 'user', text: 'Request advisor callback' },
      {
        role: 'assistant',
        text: 'Advisor interest has been logged. In a real deployment this would create an advisor task and send an email or SMS follow-up.',
      },
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50" data-tracking-surface="chatbot">
      {open && (
        <div className="mb-4 w-[calc(100vw-40px)] max-w-sm rounded-2xl bg-white shadow-elevated border border-surface-100 overflow-hidden">
          <div className="p-4 bg-surface-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black">Finova AI</p>
                <p className="text-[10px] text-surface-400 uppercase tracking-widest">Rule-based demo / {context.product}</p>
              </div>
            </div>
            <button onClick={toggleOpen} className="p-2 rounded-lg hover:bg-white/10" aria-label="Close chatbot">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-surface-50">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'assistant'
                    ? 'bg-white border border-surface-100 text-surface-700'
                    : 'bg-primary-600 text-white ml-auto'
                }`}
              >
                {message.text}
                {message.role === 'assistant' && message.route && (
                  <button
                    onClick={() => recommend(message.route, 'message_suggestion')}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-primary-600 hover:text-primary-700"
                  >
                    Open suggestion <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-surface-100 bg-white space-y-3">
            {lastInteraction && (
              <div className="rounded-xl bg-primary-50 border border-primary-100 p-3">
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Last interaction</p>
                <p className="text-xs text-surface-700 mt-1">{describeLastInteraction(lastInteraction)}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => sendMessage(prompt.prompt)}
                  className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold hover:bg-primary-100"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {actionOptions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleAction(action)}
                  className="py-2 rounded-xl bg-surface-50 hover:bg-surface-100 text-surface-700 text-[10px] font-black flex flex-col items-center gap-1"
                >
                  <action.icon className="w-4 h-4 text-primary-600" />
                  {action.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') sendMessage();
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-surface-200 text-sm outline-none focus:border-primary-500"
                placeholder={sending ? 'AI is thinking...' : 'Ask about this plan'}
                disabled={sending}
              />
              <button disabled={sending} onClick={() => sendMessage()} className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center disabled:opacity-60" aria-label="Send message">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => recommend()} className="w-full py-2.5 rounded-xl bg-surface-900 text-white text-xs font-black flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Continue Recommended Path
            </button>
          </div>
        </div>
      )}

      <button
        onClick={toggleOpen}
        className="w-14 h-14 rounded-2xl bg-primary-600 text-white shadow-glow flex items-center justify-center hover:bg-primary-500 transition-colors"
        aria-label="Open AI assistant"
      >
        {open ? <Sparkles className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
