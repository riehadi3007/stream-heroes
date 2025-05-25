"use client";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps, PieChart, Pie, Cell, Legend } from 'recharts'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, setMonth, setYear } from 'date-fns'
import { DonationHistoryService } from '@/lib/donation-history-service'
import { DonatorService } from '@/lib/donator-service'
import { CategoryService } from '@/lib/category-service'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Category, Donator } from '@/lib/types'
import { ChevronRight, Filter } from 'lucide-react'
import Link from 'next/link'

// Define types for chart data
interface DonationData {
  date: string;
  total: number;
  displayDate: string;
}

interface CategoryData {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface TopDonator {
  id: string;
  name: string;
  totalDonation: number;
  totalGame: number;
  category: string;
}

// Generate colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6A0DAD', '#4CAF50'];

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // State for selected date and donation data
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [donationData, setDonationData] = useState<DonationData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topDonators, setTopDonators] = useState<TopDonator[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [donatorsLoading, setDonatorsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);
  const [donatorsFilter, setDonatorsFilter] = useState<'all-time' | 'monthly'>('all-time');
  const [categoryFilter, setCategoryFilter] = useState<'all-time' | 'monthly'>('all-time');

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
    }
  }, [user, isLoading, router])

  // Load daily donation data when date changes or on initial load
  useEffect(() => {
    if (user && selectedDate) {
      loadDonationData();
    }
  }, [user, selectedDate]);
  
  // Load category data when date or filter changes
  useEffect(() => {
    if (user && selectedDate) {
      loadCategoryData();
    }
  }, [user, selectedDate, categoryFilter]);
  
  // Load top donators when date or filter changes
  useEffect(() => {
    if (user && selectedDate) {
      loadTopDonators();
    }
  }, [user, selectedDate, donatorsFilter]);

  const loadDonationData = async () => {
    if (!selectedDate) return;
    
    try {
      setLoading(true);
      
      // Use the selected date to get month range
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);
      
      // Get all days in the month
      const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Get donation history from the new service
      const donationHistory = await DonationHistoryService.getByDateRange(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      
      // Process data to have an entry for each day
      const dailyData = daysInMonth.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayDonations = donationHistory.filter((d) => 
          format(new Date(d.created_at), 'yyyy-MM-dd') === dayStr
        );
        
        const totalAmount = dayDonations.reduce((sum, d) => sum + Number(d.amount), 0);
        
        return {
          date: dayStr,
          total: totalAmount,
          displayDate: format(day, 'd MMM')
        };
      });
      
      setDonationData(dailyData);
    } catch (error) {
      console.error('Failed to load donation data', error);
      toast.error('Failed to load donation data');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryData = async () => {
    try {
      setCategoriesLoading(true);
      console.log(`Loading category data with filter: ${categoryFilter}, month: ${format(selectedDate, 'MMMM yyyy')}`);
      
      // Get all categories
      const categories = await CategoryService.getAll();
      
      // Get all donators
      const donators = await DonatorService.getAll();
      
      // For monthly filter, we need donation history
      let filteredDonators = [...donators];
      
      // If monthly filter is active, filter to selected month
      if (categoryFilter === 'monthly' && selectedDate) {
        // Get start and end of selected month
        const startDate = startOfMonth(selectedDate);
        const endDate = endOfMonth(selectedDate);
        
        // Get donation history for the month
        try {
          const donationHistory = await DonationHistoryService.getByDateRange(
            format(startDate, 'yyyy-MM-dd'),
            format(endDate, 'yyyy-MM-dd')
          );
          
          // Create a map of donator ID to their monthly donation amount
          const monthlyDonationMap = new Map<string, number>();
          
          // Calculate monthly donation amount for each donator
          donationHistory.forEach(history => {
            const currentAmount = monthlyDonationMap.get(history.donator_id) || 0;
            monthlyDonationMap.set(history.donator_id, currentAmount + Number(history.amount));
          });
          
          // Create new donator objects with monthly donation amounts instead of all-time
          filteredDonators = donators.map(donator => {
            const monthlyAmount = monthlyDonationMap.get(donator.id) || 0;
            // Return a new object with total_donation set to the monthly amount
            return {
              ...donator,
              total_donation: monthlyAmount
            };
          }).filter(donator => donator.total_donation > 0); // Only include donators with donations in this month
        } catch (error) {
          console.error('Failed to get monthly donation data', error);
          // Fall back to all-time data
        }
      }
      
      // Calculate total donation amount per category
      const categoryMap = new Map<string, { name: string; total: number }>();
      
      // Initialize map with all categories
      categories.forEach(category => {
        categoryMap.set(category.id, { name: category.name, total: 0 });
      });
      
      // Sum up donations by category
      filteredDonators.forEach(donator => {
        const category = categoryMap.get(donator.category_id);
        if (category) {
          category.total += donator.total_donation;
        }
      });
      
      // Convert to chart data format with colors
      const formattedData = Array.from(categoryMap.entries())
        .filter(([_, { total }]) => total > 0) // Only include categories with donations
        .map(([id, { name, total }], index) => ({
          id,
          name,
          value: total,
          color: COLORS[index % COLORS.length]
        }));
      
      setCategoryData(formattedData);
    } catch (error) {
      console.error('Failed to load category data', error);
      toast.error('Failed to load power-up distribution data');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadTopDonators = async () => {
    try {
      setDonatorsLoading(true);
      console.log(`Loading leaderboard data with filter: ${donatorsFilter}, month: ${format(selectedDate, 'MMMM yyyy')}`);
      
      // Get all donators with category info
      const donators = await DonatorService.getAll();
      
      // Filter donators based on selected filter
      let filteredDonators = [...donators];
      
      if (donatorsFilter === 'monthly' && selectedDate) {
        // Get start and end of selected month
        const startDate = startOfMonth(selectedDate);
        const endDate = endOfMonth(selectedDate);
        
        // Get donation history for the month
        try {
          const donationHistory = await DonationHistoryService.getByDateRange(
            format(startDate, 'yyyy-MM-dd'),
            format(endDate, 'yyyy-MM-dd')
          );
          
          // Create a map of donator ID to their monthly donation amount
          const monthlyDonationMap = new Map<string, number>();
          
          // Calculate monthly donation amount for each donator
          donationHistory.forEach(history => {
            const currentAmount = monthlyDonationMap.get(history.donator_id) || 0;
            monthlyDonationMap.set(history.donator_id, currentAmount + Number(history.amount));
          });
          
          // Create new donator objects with monthly donation amounts instead of all-time
          filteredDonators = donators.map(donator => {
            const monthlyAmount = monthlyDonationMap.get(donator.id) || 0;
            // Return a new object with total_donation set to the monthly amount
            return {
              ...donator,
              total_donation: monthlyAmount
            };
          }).filter(donator => donator.total_donation > 0); // Only include donators with donations in this month
        } catch (error) {
          console.error('Failed to get monthly donation data for leaderboard', error);
          // Fall back to all-time data
        }
      }
      
      // Sort by total donation (descending)
      const sortedDonators = filteredDonators.sort((a, b) => b.total_donation - a.total_donation);
      
      // Format data for display (take all for pagination)
      const topDonatorData = sortedDonators.map(donator => ({
        id: donator.id,
        name: donator.name,
        totalDonation: donator.total_donation,
        totalGame: donator.total_game,
        category: (donator as any).categories?.name || 'Unknown' // Using any to access the joined category
      }));
      
      setTopDonators(topDonatorData);
    } catch (error) {
      console.error('Failed to load top donators', error);
      toast.error('Failed to load gaming guild leaderboard');
    } finally {
      setDonatorsLoading(false);
    }
  };

  // Custom tooltip for the bar chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      // Find the data point that matches the display date
      const dataPoint = donationData.find(item => item.displayDate === label);
      const dateToShow = dataPoint ? format(parseISO(dataPoint.date), 'dd MMMM yyyy') : label;
      
      return (
        <div className="bg-slate-800 text-white p-4 border-0 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-base mb-1">{dateToShow}</p>
          <p className="flex items-center">
            <span className="mr-2 inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
            Total: Rp. {payload[0].value?.toLocaleString('id-ID')}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for the pie chart
  const PieChartTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-4 border-0 rounded-lg shadow-lg text-sm">
          <p className="font-semibold text-base mb-1">{payload[0].name}</p>
          <p className="flex items-center">
            <span
              className="mr-2 inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: payload[0].payload.color }}
            ></span>
            Total: Rp. {payload[0].value?.toLocaleString('id-ID')}
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle category filter change
  const handleCategoryFilterChange = (filter: 'all-time' | 'monthly') => {
    // Only update if it's different from current filter
    if (filter !== categoryFilter) {
      setCategoriesLoading(true); // Set loading state immediately for visual feedback
      setCategoryFilter(filter);
      // Don't need to manually call loadCategoryData here as useEffect will handle it
    }
  };

  // Handle donator filter change
  const handleDonatorFilterChange = (filter: 'all-time' | 'monthly') => {
    // Only update if it's different from current filter
    if (filter !== donatorsFilter) {
      setDonatorsLoading(true); // Set loading state immediately for visual feedback
      setDonatorsFilter(filter);
      setDisplayCount(5); // Reset display count when changing filters
      // Don't need to manually call loadTopDonators here as useEffect will handle it
    }
  };

  // Handle show more
  const handleShowMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  // Show loading state or nothing while checking authentication
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p>Loading...</p>
      </div>
    )
  }

  // Get current month and year
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  
  // Generate array of months
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Generate array of years (from 2010 to current year)
  const currentFullYear = new Date().getFullYear();
  const years = Array.from({ length: currentFullYear - 2010 + 1 }, (_, i) => 2010 + i);
  
  // Handle month change
  const handleMonthChange = (value: string) => {
    const newDate = setMonth(selectedDate, parseInt(value));
    setSelectedDate(newDate);
  };
  
  // Handle year change
  const handleYearChange = (value: string) => {
    const newDate = setYear(selectedDate, parseInt(value));
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Donation Analytics</h1>
        <div className="flex space-x-2">
          <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={currentYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Donation Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Daily Quest Rewards</CardTitle>
            <CardDescription>
              Total donation amount received per day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-[400px]">
                <p>Loading chart data...</p>
              </div>
            ) : donationData.every(day => day.total === 0) ? (
              <div className="flex justify-center items-center h-[400px]">
                <p className="text-muted-foreground">No donation data found for this period</p>
              </div>
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={donationData}
                    margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayDate" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                      tickMargin={25}
                    />
                    <YAxis 
                      tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="total" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                      name="Total Donation"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Power-Up Distribution (Category Breakdown) */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Power-Up Distribution</CardTitle>
                <CardDescription>
                  Breakdown of donations by supporter tier
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className="bg-secondary text-secondary-foreground rounded-md p-1 text-xs flex">
                  <button
                    onClick={() => handleCategoryFilterChange('all-time')}
                    className={`px-2 py-1 rounded transition-colors ${
                      categoryFilter === 'all-time' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted hover:text-foreground'
                    } ${categoriesLoading && categoryFilter === 'all-time' ? 'animate-pulse' : ''}`}
                  >
                    All-time
                  </button>
                  <button
                    onClick={() => handleCategoryFilterChange('monthly')}
                    className={`px-2 py-1 rounded transition-colors ${
                      categoryFilter === 'monthly' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted hover:text-foreground'
                    } ${categoriesLoading && categoryFilter === 'monthly' ? 'animate-pulse' : ''}`}
                  >
                    {months[currentMonth]}
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="flex justify-center items-center h-[350px]">
                <p>Loading power-up data...</p>
              </div>
            ) : categoryData.length === 0 ? (
              <div className="flex justify-center items-center h-[350px]">
                <p className="text-muted-foreground">No power-up data available</p>
              </div>
            ) : (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieChartTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Gaming Guild Leaderboard (Top Donators) */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Gaming Guild Leaderboard</CardTitle>
                <CardDescription>
                  Top supporters by total contribution
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className="bg-secondary text-secondary-foreground rounded-md p-1 text-xs flex">
                  <button
                    onClick={() => handleDonatorFilterChange('all-time')}
                    className={`px-2 py-1 rounded transition-colors ${
                      donatorsFilter === 'all-time' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted hover:text-foreground'
                    } ${donatorsLoading && donatorsFilter === 'all-time' ? 'animate-pulse' : ''}`}
                  >
                    All-time
                  </button>
                  <button
                    onClick={() => handleDonatorFilterChange('monthly')}
                    className={`px-2 py-1 rounded transition-colors ${
                      donatorsFilter === 'monthly' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted hover:text-foreground'
                    } ${donatorsLoading && donatorsFilter === 'monthly' ? 'animate-pulse' : ''}`}
                  >
                    {months[currentMonth]}
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {donatorsLoading ? (
              <div className="flex justify-center items-center h-[350px]">
                <p>Loading leaderboard data...</p>
              </div>
            ) : topDonators.length === 0 ? (
              <div className="flex justify-center items-center h-[350px]">
                <p className="text-muted-foreground">No supporters found</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-6">
                  {topDonators.slice(0, displayCount).map((donator, index) => (
                    <div key={donator.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 font-bold ${
                        index === 0 ? 'bg-yellow-200 text-yellow-800' :
                        index === 1 ? 'bg-gray-200 text-gray-800' :
                        index === 2 ? 'bg-amber-700/30 text-amber-900' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{donator.name}</p>
                            <p className="text-sm text-muted-foreground">{donator.category} • {donator.totalGame} games</p>
                          </div>
                          <p className="font-semibold">Rp. {donator.totalDonation.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="mt-2 w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-amber-700' :
                              'bg-primary'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (donator.totalDonation / (topDonators[0]?.totalDonation || 1)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {displayCount < topDonators.length && (
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleShowMore}
                      className="w-full"
                    >
                      Show More <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <div className="flex justify-end mt-2">
                  <Link href="/donators" className="text-sm text-primary hover:underline">
                    View All Supporters
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 