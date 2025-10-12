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
} from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as gtag from "@/lib/gtag"

// Brand colors
const PRIMARY = "#7930C8"
const SECONDARY = "#0D011F"

// Mock data - replace with real API calls
const mockStats = {
  totalUsers: 1247,
  totalTransactions: 3842,
  totalAmountUSD: 127543.5,
  totalAmountNGN: 198234567.89,
}

// Extended mock transactions for pagination demo
const generateMockTransactions = () => {
  const types = ["Escrow Payment", "Instant Transfer", "Group Payment", "Subscription", "Help Me Pay"]
  const statuses = ["completed", "pending"]
  const currencies = ["USD", "NGN"]
  const transactions = []

  for (let i = 1; i <= 50; i++) {
    transactions.push({
      id: `TXN${String(i).padStart(3, "0")}`,
      date: `2025-01-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")} ${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      type: types[Math.floor(Math.random() * types.length)],
      amount: Math.random() > 0.5 ? Math.floor(Math.random() * 100000) + 1000 : Math.floor(Math.random() * 100) + 10,
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      from: `User_${Math.random().toString(36).substring(2, 6)}`,
      to:
        Math.random() > 0.5
          ? `Vendor_${Math.random().toString(36).substring(2, 6)}`
          : `User_${Math.random().toString(36).substring(2, 6)}`,
      hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
    })
  }

  return transactions
}

const mockTransactions = generateMockTransactions()

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
  const [stats, setStats] = useState(mockStats)
  const [transactions, setTransactions] = useState(mockTransactions)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Track page view
  useEffect(() => {
    gtag.pageview("/stats")
  }, [])

  // In production, fetch real data
  useEffect(() => {
    // Simulate API call
    // fetchStats().then(setStats)
    // fetchTransactions().then(setTransactions)
  }, [])

  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = transactions.slice(startIndex, endIndex)

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
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats Cards */}
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
                  {stats.totalUsers.toLocaleString()}
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
                  {stats.totalTransactions.toLocaleString()}
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
                  ${stats.totalAmountUSD.toLocaleString()}
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
                  ₦{stats.totalAmountNGN.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total transferred</p>
              </CardContent>
            </Card>
          </motion.div>
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
                    {currentTransactions.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-purple-50/50">
                        <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{tx.from}</TableCell>
                        <TableCell className="font-mono text-xs">{tx.to}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {tx.currency === "USD" ? "$" : "₦"}
                          {tx.amount.toLocaleString()}
                        </TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, transactions.length)} of {transactions.length}{" "}
                  transactions
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
                        // Show first page, last page, current page, and pages around current
                        return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
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
