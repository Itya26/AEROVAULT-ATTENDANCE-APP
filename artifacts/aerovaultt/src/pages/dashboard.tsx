import { useEffect, useState } from "react";
import { useRequireAuth, useRoleRedirect } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { 
  useGetEmployeeDashboardSummary, 
  useCheckIn, 
  useCheckOut,
  getGetEmployeeDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useRequireAuth();
  useRoleRedirect(user);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { data: summary, isLoading: summaryLoading } = useGetEmployeeDashboardSummary({
    query: {
      enabled: !!user && user.role === "employee",
      queryKey: getGetEmployeeDashboardSummaryQueryKey(),
    }
  });

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "success" | "error">("idle");
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (authLoading || (user?.role === "employee" && summaryLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin/HR are redirected, so this is mostly for employees
  if (user?.role !== "employee") return null;

  const handleAttendanceAction = async (action: "in" | "out") => {
    setLocationStatus("locating");
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const payload = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            deviceInfo: navigator.userAgent
          };

          if (action === "in") {
            await checkInMutation.mutateAsync({ data: payload });
            toast({
              title: "Check-in Successful",
              description: "Your attendance has been recorded.",
            });
          } else {
            await checkOutMutation.mutateAsync({ data: payload });
            toast({
              title: "Check-out Successful",
              description: "Your departure has been recorded.",
            });
          }
          
          setLocationStatus("success");
          queryClient.invalidateQueries({ queryKey: getGetEmployeeDashboardSummaryQueryKey() });
          
          setTimeout(() => setLocationStatus("idle"), 3000);
        } catch (error: any) {
          setLocationStatus("error");
          const msg = error.response?.data?.error || `Failed to check ${action}.`;
          setLocationError(msg);
          toast({
            variant: "destructive",
            title: "Location Verification Failed",
            description: msg,
          });
        }
      },
      (error) => {
        setLocationStatus("error");
        let msg = "Failed to get your location.";
        if (error.code === 1) msg = "Location access denied. Please enable GPS.";
        else if (error.code === 2) msg = "Position unavailable. Ensure you have a clear view of the sky.";
        else if (error.code === 3) msg = "Location request timed out.";
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const isCheckedIn = !!summary?.checkInTime && !summary?.checkOutTime;
  const isCheckedOut = !!summary?.checkOutTime;
  
  const statusColor = 
    summary?.status === "present" ? "text-green-600 bg-green-50 dark:bg-green-950/30" :
    summary?.status === "late" ? "text-orange-600 bg-orange-50 dark:bg-orange-950/30" :
    summary?.status === "absent" ? "text-red-600 bg-red-50 dark:bg-red-950/30" :
    "text-blue-600 bg-blue-50 dark:bg-blue-950/30";

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name.split(' ')[0]}.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-primary/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Time & Attendance</span>
                <span className="text-sm font-normal text-muted-foreground uppercase tracking-widest">{format(currentTime, 'EEEE, MMMM d')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="text-center md:text-left">
                  <div className="text-5xl font-mono font-bold tracking-tighter text-primary">
                    {format(currentTime, 'HH:mm:ss')}
                  </div>
                  <div className="mt-2 flex items-center gap-2 justify-center md:justify-start">
                    <MapPin className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium text-muted-foreground">{user?.officeLocationName || "Office"}</span>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col gap-3 min-w-[200px]">
                  {isCheckedOut ? (
                    <div className="p-4 rounded-lg bg-muted text-center border">
                      <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Status</p>
                      <p className="font-bold text-lg">Shift Completed</p>
                    </div>
                  ) : (
                    <Button 
                      size="lg" 
                      className={`w-full h-14 text-lg font-bold transition-all ${isCheckedIn ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-primary hover:bg-primary/90'}`}
                      onClick={() => handleAttendanceAction(isCheckedIn ? "out" : "in")}
                      disabled={locationStatus === "locating"}
                    >
                      {locationStatus === "locating" ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying GPS...</>
                      ) : isCheckedIn ? (
                        "Check Out"
                      ) : (
                        "Check In"
                      )}
                    </Button>
                  )}

                  {locationStatus === "error" && (
                    <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p>{locationError}</p>
                    </div>
                  )}
                  {locationStatus === "success" && (
                    <div className="flex items-start gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <p>Location verified. Attendance recorded.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle>Today's Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider ${statusColor}`}>
                  {summary?.status.replace('_', ' ') || "Not Checked In"}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4"/> In</span>
                  <span className="font-mono font-medium">{summary?.checkInTime ? format(new Date(summary.checkInTime), 'HH:mm') : '--:--'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4"/> Out</span>
                  <span className="font-mono font-medium">{summary?.checkOutTime ? format(new Date(summary.checkOutTime), 'HH:mm') : '--:--'}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold pt-1">
                  <span>Hours</span>
                  <span className="font-mono">{summary?.workingHoursToday ? summary.workingHoursToday.toFixed(1) + 'h' : '--'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
