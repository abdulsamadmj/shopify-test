import {
  Badge,
  BlockStack,
  Card,
  Grid,
  InlineGrid,
  InlineStack,
  Layout,
  Text,
} from "@shopify/polaris";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { analyticsData, analyticsSummary } from "../data/mockStore";

const chartHeight = 300;

export function AnalyticsDashboard() {
  return (
    <Layout>
      <Layout.Section>
        <BlockStack gap="400">
          <InlineGrid gap="400" columns={{ xs: 1, sm: 2, md: 4 }}>
            {analyticsSummary.map((metric) => (
              <Card key={metric.label}>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {metric.label}
                    </Text>
                    <Badge tone={metric.tone}>{metric.trend}</Badge>
                  </InlineStack>
                  <Text as="p" variant="heading2xl">
                    {metric.value}
                  </Text>
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>

          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 8, xl: 8 }}>
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">
                      Sales and profit
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Seven-day performance using mocked storefront data.
                    </Text>
                  </BlockStack>
                  <div style={{ height: chartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData}>
                        <defs>
                          <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2c6ecb" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2c6ecb" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#008060" stopOpacity={0.26} />
                            <stop offset="95%" stopColor="#008060" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#e1e3e5" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} width={48} />
                        <Tooltip
                          formatter={(value: number) =>
                            new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              maximumFractionDigits: 0,
                            }).format(value)
                          }
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="#2c6ecb"
                          fill="url(#sales)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="profit"
                          stroke="#008060"
                          fill="url(#profit)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </BlockStack>
              </Card>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}>
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">
                      Fulfillment health
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Orders fulfilled compared with returns.
                    </Text>
                  </BlockStack>
                  <div style={{ height: chartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData}>
                        <CartesianGrid stroke="#e1e3e5" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} width={38} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="fulfilled" fill="#008060" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="returns" fill="#d72c0d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </Layout.Section>
    </Layout>
  );
}
