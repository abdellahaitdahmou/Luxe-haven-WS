-- 1. Enums for payment methods
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_payment_method') THEN
        CREATE TYPE expense_payment_method AS ENUM ('cash', 'personal_virement', 'society_virement');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'received_payment_method') THEN
        CREATE TYPE received_payment_method AS ENUM ('cash', 'virement');
    END IF;
END $$;

-- 2. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method expense_payment_method NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Received Payments Table
CREATE TABLE IF NOT EXISTS public.received_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    motif TEXT NOT NULL,
    from_whom TEXT NOT NULL,
    payment_method received_payment_method NOT NULL,
    received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.received_payments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Only admins and managers can see/manage these tables

-- Expenses Policies
CREATE POLICY "Admins and managers can view expenses"
ON public.expenses FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can update expenses"
ON public.expenses FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can delete expenses"
ON public.expenses FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
  )
);

-- Received Payments Policies
CREATE POLICY "Admins and managers can view received payments"
ON public.received_payments FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can insert received payments"
ON public.received_payments FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can update received payments"
ON public.received_payments FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can delete received payments"
ON public.received_payments FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'manager')
  )
);

-- Notify schema reload
NOTIFY pgrst, 'reload config';
