import { useRequireAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import {
  useListEmployees,
  useListDepartments,
  useListOfficeLocations,
  getListEmployeesQueryKey,
  getListDepartmentsQueryKey,
  getListOfficeLocationsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

export default function AdminPanel() {
  const { user } = useRequireAuth();

  const { data: employees } = useListEmployees(
    {},
    { query: { enabled: !!user && user.role === "admin", queryKey: getListEmployeesQueryKey({}) } },
  );
  const { data: departments } = useListDepartments({
    query: { enabled: !!user && user.role === "admin", queryKey: getListDepartmentsQueryKey() },
  });
  const { data: locations } = useListOfficeLocations({
    query: { enabled: !!user && user.role === "admin", queryKey: getListOfficeLocationsQueryKey() },
  });

  if (!user || user.role !== "admin") return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">System configuration and user management.</p>
          </div>
        </div>

        <Tabs defaultValue="employees">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Directory</CardTitle>
                <Button size="sm"><Plus className="h-4 w-4 mr-2"/> Add Employee</Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees?.map(emp => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-mono">{emp.employeeId}</TableCell>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell className="uppercase text-xs">{emp.role}</TableCell>
                          <TableCell>{emp.departmentName || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={emp.isActive ? 'default' : 'secondary'}>
                              {emp.isActive ? 'Active' : 'Inactive'}
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

          <TabsContent value="departments" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Departments</CardTitle>
                <Button size="sm"><Plus className="h-4 w-4 mr-2"/> Add Department</Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Headcount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments?.map(dept => (
                        <TableRow key={dept.id}>
                          <TableCell>{dept.id}</TableCell>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell className="text-right">{dept.employeeCount || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Office Locations (Geofences)</CardTitle>
                <Button size="sm"><Plus className="h-4 w-4 mr-2"/> Add Location</Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Coordinates</TableHead>
                        <TableHead>Radius (m)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations?.map(loc => (
                        <TableRow key={loc.id}>
                          <TableCell className="font-medium">{loc.name}</TableCell>
                          <TableCell className="font-mono text-sm">{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</TableCell>
                          <TableCell>{loc.radiusMeters}</TableCell>
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
