"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Activity,
  PieChartIcon,
  BarChart3,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import * as gtag from "@/lib/gtag"

// Brand colors
const PRIMARY = "#7930C8"
const SECONDARY = "#0D011F"
const CHART_COLORS = [PRIMARY, "#9B59D0", "#B87FD8", "#D4A5E0", "#25D366", "#FFA500", "#FF6B6B", "#4ECDC4"]

// API Types
interface StatsOverview {
  totalUsers: string
  totalTransactions: string
  volumeUSD: string
  volumeNGN: string
}

interface Transaction {
  id: string
  date: string
  type: string
  from: string
  to: string
  amount: string
  status: string
  hash: string
}

interface ChartDataPoint {
  date: string
  label: string
  usd?: number
  ngn?: number
  transactions?: number
  newUsers?: number
  cumulativeUsers?: number
  growthRate?: number
}

interface TypeDistribution {
  type: string
  count: number
  percentage: string
}

interface StatusDistribution {
  status: string
  count: number
  percentage: string
}

interface ApiResponse {
  overview: StatsOverview
  recentTransactions: {
    data: Transaction[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
  charts: {
    dailyVolume: {
      title: string
      data: ChartDataPoint[]
    }
    monthlyVolume: {
      title: string
      data: ChartDataPoint[]
    }
    userGrowth: {
      title: string
      data: ChartDataPoint[]
    }
    transactionTypes: {
      title: string
      data: TypeDistribution[]
    }
    statusDistribution: {
      title: string
      data: StatusDistribution[]
    }
  }
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

const staggerContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function StatsPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [retrying, setRetrying] = useState(false)

  // Track page view
  useEffect(() => {
    gtag.pageview("/stats")
  }, [])

  // Fetch data from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const url = `https://zend-usuz.onrender.com/stats?page=${currentPage}&limit=${itemsPerPage}`
        console.log("Fetching from:", url)

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        console.log("Response status:", response.status)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const jsonData = await response.json()
        console.log("Data received successfully")
        setData(jsonData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to connect to server"
        console.error("Error fetching stats:", err)
        setError(errorMessage)
      } finally {
        setLoading(false)
        setRetrying(false)
      }
    }

    fetchStats()
  }, [currentPage, itemsPerPage, retrying])

  const handleRetry = () => {
    setRetrying(true)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
    gtag.event({
      action: "page_change",
      category: "Stats",
      label: `Page ${page}`,
    })
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
    gtag.event({
      action: "items_per_page_change",
      category: "Stats",
      label: value,
    })
  }

  const handleHashClick = (txId: string) => {
    gtag.event({
      action: "hash_click",
      category: "Stats",
      label: txId,
    })
  }

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address
    return `${address.slice(0, 10)}...${address.slice(-6)}`
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-purple-50/30 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: PRIMARY }} />
          <p className="text-sm text-muted-foreground">
            {retrying ? "Retrying connection..." : "Loading ZEND stats..."}
          </p>
          <p className="text-xs text-muted-foreground">This may take a moment...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-purple-50/30 to-white">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="rounded-full bg-red-100 p-3">
              <Activity className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Unable to Load Stats</h3>
              <p className="mt-2 text-sm text-muted-foreground">{error || "Failed to load statistics"}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRetry} style={{ backgroundColor: PRIMARY }} className="text-white">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  const { overview, recentTransactions, charts } = data
  const totalPages = recentTransactions.pagination.totalPages

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-sm hover:opacity-80">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <img src="/images/logo-transparent.png" alt="ZEND logo" className="h-6 w-6" />
            <span className="text-lg font-semibold" style={{ color: PRIMARY }}>
              ZEND Stats
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="flex items-center gap-2"
            disabled={loading || retrying}
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Overview Stats Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={fadeUpItem}>
            <Card className="border-purple-100 bg-white/60 backdrop-blur-sm transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>
                  {overview.totalUsers}
                </div>
                <p className="text-xs text-muted-foreground">Active on platform</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUpItem}>
            <Card className="border-purple-100 bg-white/60 backdrop-blur-sm transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>
                  {overview.totalTransactions}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUpItem}>
            <Card className="border-purple-100 bg-white/60 backdrop-blur-sm transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume (USD)</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>
                  {overview.volumeUSD}
                </div>
                <p className="text-xs text-muted-foreground">Total transferred</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUpItem}>
            <Card className="border-purple-100 bg-white/60 backdrop-blur-sm transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume (NGN)</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>
                  {overview.volumeNGN}
                </div>
                <p className="text-xs text-muted-foreground">Total transferred</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8"
        >
          <Tabs defaultValue="volume" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="volume">
                <BarChart3 className="mr-2 h-4 w-4" />
                Volume
              </TabsTrigger>
              <TabsTrigger value="growth">
                <TrendingUp className="mr-2 h-4 w-4" />
                Growth
              </TabsTrigger>
              <TabsTrigger value="types">
                <PieChartIcon className="mr-2 h-4 w-4" />
                Types
              </TabsTrigger>
              <TabsTrigger value="status">
                <Activity className="mr-2 h-4 w-4" />
                Status
              </TabsTrigger>
            </TabsList>

            {/* Daily/Monthly Volume Charts */}
            <TabsContent value="volume" className="space-y-4">
              {/* Daily Volume */}
              <Card className="border-purple-100 bg-white/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{charts.dailyVolume.title}</CardTitle>
                  <CardDescription>Transaction volume over the past 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={charts.dailyVolume.data}>
                      <defs>
                        <linearGradient id="colorNgn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="ngn"
                        stroke={PRIMARY}
                        fillOpacity={1}
                        fill="url(#colorNgn)"
                        name="NGN Volume"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Volume */}
              <Card className="border-purple-100 bg-white/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{charts.monthlyVolume.title}</CardTitle>
                  <CardDescription>Transaction volume over the past 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={charts.monthlyVolume.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="ngn" fill={PRIMARY} name="NGN Volume" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="transactions" fill={CHART_COLORS[4]} name="Transactions" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Growth */}
            <TabsContent value="growth">
              <Card className="border-purple-100 bg-white/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{charts.userGrowth.title}</CardTitle>
                  <CardDescription>Platform user growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={charts.userGrowth.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="newUsers"
                        stroke={CHART_COLORS[4]}
                        strokeWidth={2}
                        name="New Users"
                        dot={{ fill: CHART_COLORS[4] }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulativeUsers"
                        stroke={PRIMARY}
                        strokeWidth={3}
                        name="Total Users"
                        dot={{ fill: PRIMARY }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transaction Types */}
            <TabsContent value="types">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-purple-100 bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>{charts.transactionTypes.title}</CardTitle>
                    <CardDescription>Distribution by transaction type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={charts.transactionTypes.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ type, percentage }) => `${type}: ${percentage}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {charts.transactionTypes.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-purple-100 bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Type Breakdown</CardTitle>
                    <CardDescription>Detailed transaction type statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {charts.transactionTypes.data.map((item, index) => (
                        <div key={item.type} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-4 w-4 rounded"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{item.type}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{item.count} txns</span>
                            <Badge variant="secondary">{item.percentage}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Status Distribution */}
            <TabsContent value="status">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-purple-100 bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>{charts.statusDistribution.title}</CardTitle>
                    <CardDescription>Transaction completion status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={charts.statusDistribution.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="count"
                          label={({ status, percentage }) => `${status}: ${percentage}%`}
                        >
                          {charts.statusDistribution.data.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.status.toLowerCase() === "completed" ? CHART_COLORS[4] : CHART_COLORS[5]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-purple-100 bg-white/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Status Summary</CardTitle>
                    <CardDescription>Current transaction status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {charts.statusDistribution.data.map((item) => (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{
                                backgroundColor:
                                  item.status.toLowerCase() === "completed" ? CHART_COLORS[4] : CHART_COLORS[5],
                              }}
                            />
                            <span className="text-sm font-medium">{item.status}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{item.count} txns</span>
                            <Badge
                              variant={item.status.toLowerCase() === "completed" ? "default" : "secondary"}
                              className={
                                item.status.toLowerCase() === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }
                            >
                              {item.percentage}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8"
        >
          <Card className="border-purple-100 bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <p className="text-sm text-muted-foreground">Latest payment activities on the platform</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentTransactions.data.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-purple-50/50">
                          <TableCell className="font-mono text-sm">{tx.id.slice(-8)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{tx.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{truncateAddress(tx.from)}</TableCell>
                          <TableCell className="font-mono text-xs">{truncateAddress(tx.to)}</TableCell>
                          <TableCell className="text-right font-semibold">{tx.amount}</TableCell>
                          <TableCell>
                            <Badge
                              variant={tx.status === "completed" ? "default" : "secondary"}
                              className={
                                tx.status === "completed"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                              }
                            >
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <a
                              href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-xs transition-colors hover:text-purple-600"
                              style={{ color: PRIMARY }}
                              onClick={() => handleHashClick(tx.id)}
                            >
                              {truncateHash(tx.hash)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing page {recentTransactions.pagination.currentPage} of {totalPages} (
                    {recentTransactions.pagination.totalItems} total transactions)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                          )
                        })
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center gap-1">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="h-8 w-8 p-0"
                              style={currentPage === page ? { backgroundColor: PRIMARY, borderColor: PRIMARY } : {}}
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            All user identities are anonymized for privacy. Transaction data is updated in real-time.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
