/**
 * Bounce Back Academy — Safe, Lightweight Client Analytics
 *
 * Dispatches standard educational engagement events to dataLayer,
 * window.gtag (if configured), and browser CustomEvents.
 * Strictly avoids capturing any PII or sensitive student data.
 */

export interface LearningPathEvent {
  pathTitle: string;
  destination: string;
}

export interface ClassExamSelectEvent {
  name: string;
  type: 'school_class' | 'competitive_exam';
  destination: string;
}

export interface ResourceOpenEvent {
  resourceType: 'NOTE' | 'PAPER' | 'VIDEO' | 'QUIZ';
  resourceId?: string;
  title: string;
  className?: string;
}

export interface PremiumOfferClickEvent {
  itemId: string;
  itemTitle: string;
  price: number;
  className?: string | null;
}

export interface CheckoutStartEvent {
  itemId: string;
  itemTitle: string;
  amount: number;
}

export interface PurchaseSuccessEvent {
  orderId: string;
  amount: number;
  itemCount?: number;
}

function safeDispatch(eventName: string, payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  try {
    // 1. Google Tag Manager / Gtag compatibility
    const w = window as unknown as {
      dataLayer?: Array<Record<string, unknown>>;
      gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
    };

    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: eventName, ...payload, timestamp: Date.now() });
    }

    if (typeof w.gtag === 'function') {
      w.gtag('event', eventName, payload);
    }

    // 2. Browser CustomEvent for local observability / testing
    const customEvt = new CustomEvent('bba_analytics', {
      detail: { event: eventName, ...payload },
    });
    window.dispatchEvent(customEvt);
  } catch {
    // Fail silently in environments with strict sandbox restrictions
  }
}

export function trackLearningPathClick(data: LearningPathEvent) {
  safeDispatch('learning_path_click', {
    path_title: data.pathTitle,
    destination: data.destination,
  });
}

export function trackClassExamSelect(data: ClassExamSelectEvent) {
  safeDispatch('class_exam_select', {
    target_name: data.name,
    target_type: data.type,
    destination: data.destination,
  });
}

export function trackResourceOpen(data: ResourceOpenEvent) {
  safeDispatch('resource_open', {
    resource_type: data.resourceType,
    resource_id: data.resourceId,
    resource_title: data.title,
    class_name: data.className,
  });
}

export function trackPremiumOfferClick(data: PremiumOfferClickEvent) {
  safeDispatch('premium_offer_click', {
    item_id: data.itemId,
    item_title: data.itemTitle,
    price: data.price,
    class_name: data.className,
  });
}

export function trackCheckoutStart(data: CheckoutStartEvent) {
  safeDispatch('checkout_start', {
    item_id: data.itemId,
    item_title: data.itemTitle,
    amount: data.amount,
  });
}

export function trackPurchaseSuccess(data: PurchaseSuccessEvent) {
  safeDispatch('purchase_success', {
    order_id: data.orderId,
    amount: data.amount,
    item_count: data.itemCount ?? 1,
  });
}
