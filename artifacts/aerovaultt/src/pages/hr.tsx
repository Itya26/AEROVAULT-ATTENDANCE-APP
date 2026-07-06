import { useRequireAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useGetHrDashboardSummary, useListAttendance, useListLeaves, useReviewLeave, useCorrectAttendance, getListAttendanceQueryKey, getListLeavesQueryKey, getGetHrDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Users, UserCheck, UserX, Clock, CalendarDays } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HrDashboard() {
  const { user } = useRequireAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: summary } = useGetHrDashboardSummary({
    query: {
      enabled: !!user && (user.role === "hr" || user.role === "admin"),
      queryKey: getGetHrDashboardSummaryQueryKey(),
    },
  });

  const { data: attendance } = useListAttendance(
    { date: format(new Date(), 'yyyy-MM-dd') },
    {
      query: {
        enabled: !!user && (user.role === "hr" || user.role === "admin"),
        queryKey: getListAttendanceQueryKey({ date: format(new Date(), 'yyyy-MM-dd') }),
      },
    }
  );

  const { data: leaves } = useListLeaves(
    { status: "pending" },
    {
      query: {
        enabled: !!user && (user.role === "hr" || user.role === "admin"),
        queryKey: getListLeavesQueryKey({ status: "pending" }),
      },
    }
  );

  const reviewLeaveMutation = useReviewLeave();

  const handleLeaveReview = async (id: number, status: "approved" | "rejected") => {
    try {
      await reviewLeaveMutation.mutateAsync({ id, data: { status } });
      toast({ title: `Leave request ${status}` });
      queryClient.invalidateQueries({ queryKey: getListLeavesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetHrDashboardSummaryQueryKey() });
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to review leave" });
    }
  };

  if (!user || (user.role !== "hr" && user.role !== "admin")) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of today's attendance and pending requests.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <UserCheck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <h3 className="text-2xl font-bold">{summary?.presentToday || 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <UserX className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <h3 className="text-2xl font-bold">{summary?.absentToday || 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Late</p>
                <h3 className="text-2xl font-bold">{summary?.lateArrivals || 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <CalendarDays className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leave Req</p>
                <h3 className="text-2xl font-bold">{summary?.pendingLeaveRequests || 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <h3 className="text-2xl font-bold">{summary?.attendancePercentage.toFixed(1)}%</h3>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${summary?.attendancePercentage || 0}%` }}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="attendance">
          <TabsList>
            <TabsTrigger value="attendance">Today's Attendance</TabsTrigger>
            <TabsTrigger value="leaves">Pending Leaves ({leaves?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="attendance" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Register</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance?.map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{record.employeeName}</span>
                              <span className="text-xs text-muted-foreground">ID: {record.employeeId}</span>
                            </div>
                          </TableCell>
                          <TableCell>{record.departmentName}</TableCell>
                          <TableCell>{record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm') : '--:--'}</TableCell>
                          <TableCell>{record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm') : '--:--'}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'present' ? 'default' : record.status === 'absent' ? 'destructive' : 'secondary'}>
                              {record.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaves" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending requests</TableCell>
                        </TableRow>
                      ) : leaves?.map(leave => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">{leave.employeeName}</TableCell>
                          <TableCell className="uppercase text-xs">{leave.type}</TableCell>
                          <TableCell>{format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d')}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={leave.reason}>{leave.reason}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => handleLeaveReview(leave.id, "approved")}>Approve</Button>
                              <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50" onClick={() => handleLeaveReview(leave.id, "rejected")}>Reject</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
