"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

export type CurrencyCode = "USD" | "EUR" | "MAD";

interface CurrencyInfo {
    code: CurrencyCode;
    symbol: string;
    name: string;
}

export const CURRENCIES: CurrencyInfo[] = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
];

interface CurrencyContextValue {
    currency: CurrencyInfo;
    setCurrency: (code: CurrencyCode) => void;
    format: (amount: number) => string;
}

const defaultCurrency = CURRENCIES[0];

const CurrencyContext = createContext<CurrencyContextValue>({
    currency: defaultCurrency,
    setCurrency: () => { },
    format: (amount) => `$${amount.toLocaleString()}`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyInfo>(defaultCurrency);
    const supabase = createClient();

    // Load saved currency from admin_settings on mount
    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await supabase
                    .from("admin_settings")
                    .select("value")
                    .eq("key", "platform_currency")
                    .single();

                if (data?.value) {
                    const found = CURRENCIES.find(c => c.code === data.value);
                    if (found) setCurrencyState(found);
                }
            } catch {
                // table might not have this key yet — use default
            }
        };
        load();
    }, []);

    const setCurrency = (code: CurrencyCode) => {
        const found = CURRENCIES.find(c => c.code === code);
        if (found) setCurrencyState(found);
    };

    const format = (amount: number): string => {
        if (currency.code === "MAD") {
            return `${amount.toLocaleString()} MAD`;
        }
        return `${currency.symbol}${amount.toLocaleString()}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}
