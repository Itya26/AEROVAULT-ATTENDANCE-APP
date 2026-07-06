import { useRequireAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useGetAttendanceHistory, getGetAttendanceHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function Attendance() {
  const { user } = useRequireAuth();
  
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const { data: attendanceHistory, isLoading } = useGetAttendanceHistory(
    { month, year },
    { query: { enabled: !!user, queryKey: getGetAttendanceHistoryQueryKey({ month, year }) } }
  );

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2000, i, 1), 'MMMM')
  }));

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
            <p className="text-muted-foreground mt-1">View your attendance records.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : attendanceHistory && attendanceHistory.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm') : '--:--'}</TableCell>
                        <TableCell>{record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm') : '--:--'}</TableCell>
                        <TableCell>{record.workingHours ? record.workingHours.toFixed(2) : '--'}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'present' ? 'default' : record.status === 'absent' ? 'destructive' : 'secondary'}>
                            {record.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.locationVerified ? (
                            <span className="text-green-600 text-sm font-medium">Verified</span>
                          ) : (
                            <span className="text-red-600 text-sm font-medium">Unverified</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found for the selected period.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
