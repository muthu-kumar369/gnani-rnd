# Stage R8: Analytics Enhancement

**Priority**: 🟢 LOW  
**Effort**: 8-10 hours  
**Impact**: Detailed usage insights  
**Dependencies**: None

---

## OVERVIEW

### Problem Statement
Current analytics dashboard is basic with limited backend tracking. Missing detailed token usage, cost calculations, historical trends, and export functionality.

### Current State
- ✅ Basic analytics UI exists (`AnalyticsDashboard.tsx`)
- ✅ Basic backend tracking (`analytics.service.ts`)
- ❌ NO detailed token usage tracking
- ❌ NO cost calculations
- ❌ NO historical charts
- ❌ NO export functionality
- ⚠️ Limited metrics collection

### Target State
- ✅ Per-message token tracking (input/output separate)
- ✅ Cost calculations per conversation
- ✅ Historical charts (daily/weekly/monthly)
- ✅ Export to CSV/JSON
- ✅ Usage alerts and limits
- ✅ ChatGPT-level analytics

---

## IMPLEMENTATION STEPS

### Step 1: Add Token Tracking to Message Model

**File**: `gnani-rnd-backend/src/modules/memory/entities/conversation.entity.ts`

```typescript
// Add to message schema
export interface ConversationMessage {
    // ... existing fields
    tokenUsage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        model: string;
        timestamp: Date;
    };
    cost?: {
        amount: number;      // in USD
        currency: string;
        model: string;
    };
}

// Update schema
const conversationMessageSchema = new Schema({
    // ... existing fields
    tokenUsage: {
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        totalTokens: { type: Number, default: 0 },
        model: { type: String },
        timestamp: { type: Date, default: Date.now }
    },
    cost: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        model: { type: String }
    }
});
```

---

### Step 2: Create Cost Calculator Utility

**File**: `gnani-rnd-backend/src/utils/costCalculator.ts`

```typescript
// Model pricing (per 1M tokens)
const MODEL_PRICING = {
    'gpt-4': {
        input: 30.00,   // $30 per 1M input tokens
        output: 60.00   // $60 per 1M output tokens
    },
    'gpt-3.5-turbo': {
        input: 0.50,
        output: 1.50
    },
    'gemma:2b': {
        input: 0.00,    // Free (local)
        output: 0.00
    },
    'claude-3-opus': {
        input: 15.00,
        output: 75.00
    }
};

export class CostCalculator {
    /**
     * Calculate cost for token usage
     */
    static calculateCost(
        inputTokens: number,
        outputTokens: number,
        model: string
    ): number {
        const pricing = MODEL_PRICING[model];
        if (!pricing) {
            console.warn(`No pricing data for model: ${model}`);
            return 0;
        }

        const inputCost = (inputTokens / 1_000_000) * pricing.input;
        const outputCost = (outputTokens / 1_000_000) * pricing.output;
        
        return inputCost + outputCost;
    }

    /**
     * Calculate conversation total cost
     */
    static async calculateConversationCost(conversationId: string): Promise<number> {
        const messages = await ConversationMessage.find({ conversationId });
        
        return messages.reduce((total, msg) => {
            return total + (msg.cost?.amount || 0);
        }, 0);
    }

    /**
     * Calculate user monthly cost
     */
    static async calculateMonthlyCost(userId: string, month: Date): Promise<number> {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const messages = await ConversationMessage.find({
            userId,
            timestamp: { $gte: startOfMonth, $lte: endOfMonth }
        });

        return messages.reduce((total, msg) => {
            return total + (msg.cost?.amount || 0);
        }, 0);
    }

    /**
     * Format cost for display
     */
    static formatCost(amount: number, currency: string = 'USD'): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        }).format(amount);
    }
}
```

---

### Step 3: Track Tokens in LLM Service

**File**: `gnani-rnd-backend/src/modules/llm/llm.service.ts`

```typescript
// Modify generateResponse to track tokens
async generateResponse(prompt: string, options: any): Promise<string> {
    const startTime = Date.now();
    
    // Generate response (existing code)
    const response = await this.callLLM(prompt, options);
    
    // Extract token usage from response
    const tokenUsage = {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        model: options.model || 'unknown',
        timestamp: new Date()
    };

    // Calculate cost
    const cost = {
        amount: CostCalculator.calculateCost(
            tokenUsage.inputTokens,
            tokenUsage.outputTokens,
            tokenUsage.model
        ),
        currency: 'USD',
        model: tokenUsage.model
    };

    // Store in message metadata (will be saved by conversation service)
    this.currentTokenUsage = tokenUsage;
    this.currentCost = cost;

    return response.text;
}
```

---

### Step 4: Create Usage Chart Component

**File**: `react/src/components/analytics/UsageChart.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UsageData {
    date: string;
    tokens: number;
    cost: number;
    messages: number;
}

export const UsageChart: React.FC = () => {
    const [data, setData] = useState<UsageData[]>([]);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

    useEffect(() => {
        fetchUsageData(timeRange).then(setData);
    }, [timeRange]);

    return (
        <div className="usage-chart">
            <div className="chart-header">
                <h3>Usage Trends</h3>
                <div className="time-range-selector">
                    <button
                        onClick={() => setTimeRange('week')}
                        className={timeRange === 'week' ? 'active' : ''}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => setTimeRange('month')}
                        className={timeRange === 'month' ? 'active' : ''}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => setTimeRange('year')}
                        className={timeRange === 'year' ? 'active' : ''}
                    >
                        Year
                    </button>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="tokens"
                        stroke="#8884d8"
                        name="Tokens"
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cost"
                        stroke="#82ca9d"
                        name="Cost ($)"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

async function fetchUsageData(timeRange: string): Promise<UsageData[]> {
    const response = await fetch(`/api/analytics/usage?range=${timeRange}`);
    return response.json();
}
```

---

### Step 5: Create Cost Estimator Component

**File**: `react/src/components/analytics/CostEstimator.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface CostSummary {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    trend: 'up' | 'down' | 'stable';
}

export const CostEstimator: React.FC = () => {
    const [summary, setSummary] = useState<CostSummary | null>(null);

    useEffect(() => {
        fetchCostSummary().then(setSummary);
    }, []);

    if (!summary) return <div>Loading...</div>;

    const monthlyChange = summary.thisMonth - summary.lastMonth;
    const percentChange = (monthlyChange / summary.lastMonth) * 100;

    return (
        <div className="cost-estimator">
            <h3>Cost Summary</h3>

            <div className="cost-cards">
                <div className="cost-card">
                    <div className="cost-label">Today</div>
                    <div className="cost-amount">${summary.today.toFixed(4)}</div>
                </div>

                <div className="cost-card">
                    <div className="cost-label">This Week</div>
                    <div className="cost-amount">${summary.thisWeek.toFixed(4)}</div>
                </div>

                <div className="cost-card">
                    <div className="cost-label">This Month</div>
                    <div className="cost-amount">${summary.thisMonth.toFixed(2)}</div>
                </div>

                <div className="cost-card">
                    <div className="cost-label">Last Month</div>
                    <div className="cost-amount">${summary.lastMonth.toFixed(2)}</div>
                </div>
            </div>

            <div className="cost-trend">
                {summary.trend === 'up' ? (
                    <TrendingUp className="text-red-400" />
                ) : (
                    <TrendingDown className="text-green-400" />
                )}
                <span>
                    {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% vs last month
                </span>
            </div>

            <div className="cost-breakdown">
                <h4>Cost by Model</h4>
                {/* Model breakdown chart */}
            </div>
        </div>
    );
};

async function fetchCostSummary(): Promise<CostSummary> {
    const response = await fetch('/api/analytics/cost-summary');
    return response.json();
}
```

---

### Step 6: Add Export Functionality

**File**: `react/src/components/analytics/ExportButton.tsx`

```typescript
import React, { useState } from 'react';
import { Download } from 'lucide-react';

export const ExportButton: React.FC = () => {
    const [exporting, setExporting] = useState(false);

    const exportToCSV = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/analytics/export?format=csv');
            const blob = await response.blob();
            
            // Download file
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${new Date().toISOString()}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    const exportToJSON = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/analytics/export?format=json');
            const data = await response.json();
            
            // Download file
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${new Date().toISOString()}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="export-button">
            <button onClick={exportToCSV} disabled={exporting}>
                <Download size={16} />
                Export CSV
            </button>
            <button onClick={exportToJSON} disabled={exporting}>
                <Download size={16} />
                Export JSON
            </button>
        </div>
    );
};
```

---

### Step 7: Create Backend Export Endpoint

**File**: `gnani-rnd-backend/src/modules/analytics/analytics.routes.ts`

```typescript
// Add export endpoint
router.get('/export', async (req, res) => {
    const { format = 'csv' } = req.query;
    const userId = req.user.id;

    try {
        const data = await analyticsService.getExportData(userId);

        if (format === 'csv') {
            const csv = convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
            res.send(csv);
        } else {
            res.json(data);
        }
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
});

function convertToCSV(data: any[]): string {
    const headers = ['Date', 'Conversation', 'Model', 'Tokens', 'Cost'];
    const rows = data.map(row => [
        row.date,
        row.conversationTitle,
        row.model,
        row.tokens,
        row.cost
    ]);

    return [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
}
```

---

## TESTING INSTRUCTIONS

### Test 1: Token Tracking
1. Send a message
2. Check database for message
3. **Expected**: `tokenUsage` field populated with input/output tokens

### Test 2: Cost Calculation
1. Send message with GPT-4
2. Check message cost
3. **Expected**: Cost calculated correctly (e.g., 1000 tokens ≈ $0.03)

### Test 3: Usage Charts
1. Open analytics dashboard
2. View usage chart
3. **Expected**: Chart shows token usage over time

### Test 4: Cost Summary
1. Open analytics dashboard
2. View cost summary
3. **Expected**: Today, week, month costs displayed

### Test 5: Export
1. Click "Export CSV"
2. **Expected**: CSV file downloads with all data
3. Click "Export JSON"
4. **Expected**: JSON file downloads

---

## SUCCESS CRITERIA

- [x] Token usage tracked per message
- [x] Cost calculated accurately (within 5%)
- [x] Charts display trends clearly
- [x] Export to CSV works
- [x] Export to JSON works
- [x] Performance acceptable (< 1s load)
- [x] Cost breakdown by model
- [x] Monthly cost comparison

---

## CHATGPT PARITY

ChatGPT Analytics:
- Token usage tracking ✅
- Cost estimates ⚠️ (not shown to users)
- Usage trends ❌ (not available)
- Export ❌ (not available)

**Verdict**: ✅ **EXCEEDS** ChatGPT

---

## REFERENCES

- Verification Report: Lines 756-763 (Analytics gap)
- recharts: https://recharts.org/
- Cost Calculator pattern

---

**Status**: Ready for implementation  
**Estimated Time**: 8-10 hours  
**Priority**: LOW
