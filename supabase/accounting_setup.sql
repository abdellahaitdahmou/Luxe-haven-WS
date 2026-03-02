-- ==========================================
-- ACCOUNTING SYSTEM SETUP
-- Feature: Expenses & Received Payments
-- Author: Antigravity
-- ==========================================

-- 1. DROP EXISTING IF NEEDED (Optional, use with caution)
-- DROP TABLE IF EXISTS public.expenses;
-- DROP TABLE IF EXISTS public.received_payments;
-- DROP TYPE IF EXISTS expense_payment_method;
-- DROP TYPE IF EXISTS received_payment_method;

-- 2. CREATE ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_payment_method') THEN
        CREATE TYPE expense_payment_method AS ENUM ('cash', 'personal_virement', 'society_virement');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'received_payment_method') THEN
        CREATE TYPE received_payment_method AS ENUM ('cash', 'virement');
    END IF;
END $$;

-- 3. CREATE EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method expense_payment_method NOT NULL,
    property_name TEXT,
    category TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE RECEIVED PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.received_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    motif TEXT NOT NULL,
    from_whom TEXT NOT NULL,
    payment_method received_payment_method NOT NULL,
    property_name TEXT,
    category TEXT,
    received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.received_payments ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES (Admins and Managers only)

-- Expenses: Full CRUD for Admins/Managers
CREATE POLICY "Accounting: Admins and managers can view expenses"
ON public.expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Accounting: Admins and managers can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Accounting: Admins and managers can update expenses"
ON public.expenses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Accounting: Admins and managers can delete expenses"
ON public.expenses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Received Payments: Full CRUD for Admins/Managers
CREATE POLICY "Accounting: Admins and managers can view received payments"
ON public.received_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Accounting: Admins and managers can insert received payments"
ON public.received_payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Accounting: Admins and managers can update received payments"
ON public.received_payments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Accounting: Admins and managers can delete received payments"
ON public.received_payments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- 7. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload config';
