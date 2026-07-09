import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRequireAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import {
  useListEmployees,
  useListDepartments,
  useListOfficeLocations,
  useCreateEmployee,
  useDeactivateEmployee,
  useCreateDepartment,
  useDeleteDepartment,
  useCreateOfficeLocation,
  useUpdateOfficeLocation,
  useDeleteOfficeLocation,
  getListEmployeesQueryKey,
  getListDepartmentsQueryKey,
  getListOfficeLocationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserX, UserCheck, Pencil, Trash2, Loader2 } from "lucide-react";

const NONE = "__none__";

// ---------------------------------------------------------------------------
// Add Employee
// ---------------------------------------------------------------------------

const employeeSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["employee", "hr", "admin"]),
  departmentId: z.string().optional(),
  officeLocationId: z.string().optional(),
  shiftStart: z.string().optional(),
  shiftEnd: z.string().optional(),
});

function AddEmployeeDialog({
  open,
  onOpenChange,
  departments,
  locations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: { id: number; name: string }[] | undefined;
  locations: { id: number; name: string }[] | undefined;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "employee",
      departmentId: NONE,
      officeLocationId: NONE,
      shiftStart: "",
      shiftEnd: "",
    },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open]);

  const createEmployee = useCreateEmployee({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey({}) });
        toast({ title: "Employee added" });
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Could not add employee",
          description: error?.response?.data?.error || error?.message || "An error occurred.",
        });
      },
    },
  });

  const onSubmit = (values: z.infer<typeof employeeSchema>) => {
    createEmployee.mutate({
      data: {
        employeeId: values.employeeId,
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        role: values.role,
        departmentId: values.departmentId && values.departmentId !== NONE ? Number(values.departmentId) : undefined,
        officeLocationId:
          values.officeLocationId && values.officeLocationId !== NONE ? Number(values.officeLocationId) : undefined,
        shiftStart: values.shiftStart || undefined,
        shiftEnd: values.shiftEnd || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>Create a new employee account with login access.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input placeholder="AV-EMP-003" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@aerovault.space" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 90000 00000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="At least 6 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {departments?.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="officeLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {locations?.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shiftStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift Start (optional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shiftEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift End (optional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEmployee.isPending}>
                {createEmployee.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Employee
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add Department
// ---------------------------------------------------------------------------

const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
});

function AddDepartmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open]);

  const createDepartment = useCreateDepartment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        toast({ title: "Department added" });
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Could not add department",
          description: error?.response?.data?.error || error?.message || "An error occurred.",
        });
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => createDepartment.mutate({ data: values }))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Engineering" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDepartment.isPending}>
                {createDepartment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Department
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit Office Location
// ---------------------------------------------------------------------------

const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().min(1, "Radius must be at least 1 meter"),
});

function LocationDialog({
  open,
  onOpenChange,
  editingLocation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLocation: { id: number; name: string; latitude: number; longitude: number; radiusMeters: number } | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!editingLocation;

  const form = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: "", latitude: 0, longitude: 0, radiusMeters: 100 },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editingLocation
          ? {
              name: editingLocation.name,
              latitude: editingLocation.latitude,
              longitude: editingLocation.longitude,
              radiusMeters: editingLocation.radiusMeters,
            }
          : { name: "", latitude: 0, longitude: 0, radiusMeters: 100 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingLocation?.id]);

  const onSettled = () => {
    queryClient.invalidateQueries({ queryKey: getListOfficeLocationsQueryKey() });
    onOpenChange(false);
  };

  const createLocation = useCreateOfficeLocation({
    mutation: {
      onSuccess: () => {
        toast({ title: "Location added" });
        onSettled();
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Could not add location",
          description: error?.response?.data?.error || error?.message || "An error occurred.",
        });
      },
    },
  });

  const updateLocation = useUpdateOfficeLocation({
    mutation: {
      onSuccess: () => {
        toast({ title: "Location updated" });
        onSettled();
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Could not update location",
          description: error?.response?.data?.error || error?.message || "An error occurred.",
        });
      },
    },
  });

  const onSubmit = (values: z.infer<typeof locationSchema>) => {
    if (isEditing) {
      updateLocation.mutate({ id: editingLocation.id, data: values });
    } else {
      createLocation.mutate({ data: values });
    }
  };

  const isPending = createLocation.isPending || updateLocation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Location" : "Add Location"}</DialogTitle>
          <DialogDescription>
            Employees must be within this radius to mark attendance from this location.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name</FormLabel>
                  <FormControl>
                    <Input placeholder="HQ - Coimbatore" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="radiusMeters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Radius (meters)</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Add Location"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Admin Panel
// ---------------------------------------------------------------------------

export default function AdminPanel() {
  const { user } = useRequireAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [pendingEmployee, setPendingEmployee] = useState<{ id: number; name: string; isActive: boolean } | null>(
    null,
  );
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [addDepartmentOpen, setAddDepartmentOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  } | null>(null);
  const [pendingDeleteLocation, setPendingDeleteLocation] = useState<{ id: number; name: string } | null>(null);
  const [pendingDeleteDepartment, setPendingDeleteDepartment] = useState<{ id: number; name: string } | null>(null);

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

  const deactivateEmployee = useDeactivateEmployee({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey({}) });
        setPendingEmployee(null);
      },
    },
  });

  const deleteDepartment = useDeleteDepartment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        setPendingDeleteDepartment(null);
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Could not delete department",
          description:
            error?.response?.data?.error ||
            error?.message ||
            "This department may still have employees assigned to it.",
        });
        setPendingDeleteDepartment(null);
      },
    },
  });

  const deleteLocation = useDeleteOfficeLocation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOfficeLocationsQueryKey() });
        setPendingDeleteLocation(null);
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Could not delete location",
          description:
            error?.response?.data?.error ||
            error?.message ||
            "This location may still be assigned to employees.",
        });
        setPendingDeleteLocation(null);
      },
    },
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
                <Button size="sm" onClick={() => setAddEmployeeOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Employee
                </Button>
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees?.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell className="font-mono">{emp.employeeId}</TableCell>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell className="uppercase text-xs">{emp.role}</TableCell>
                          <TableCell>{emp.departmentName || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={emp.isActive ? "default" : "secondary"}>
                              {emp.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={emp.isActive ? "outline" : "secondary"}
                              onClick={() =>
                                setPendingEmployee({ id: emp.id, name: emp.name, isActive: emp.isActive })
                              }
                            >
                              {emp.isActive ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" /> Reactivate
                                </>
                              )}
                            </Button>
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
                <Button size="sm" onClick={() => setAddDepartmentOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Department
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Headcount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments?.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell>{dept.id}</TableCell>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell className="text-right">{dept.employeeCount || 0}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPendingDeleteDepartment({ id: dept.id, name: dept.name })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                          </TableCell>
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
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingLocation(null);
                    setLocationDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Location
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Coordinates</TableHead>
                        <TableHead>Radius (m)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations?.map((loc) => (
                        <TableRow key={loc.id}>
                          <TableCell className="font-medium">{loc.name}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                          </TableCell>
                          <TableCell>{loc.radiusMeters}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingLocation(loc);
                                setLocationDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPendingDeleteLocation({ id: loc.id, name: loc.name })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
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

      <AddEmployeeDialog
        open={addEmployeeOpen}
        onOpenChange={setAddEmployeeOpen}
        departments={departments}
        locations={locations}
      />

      <AddDepartmentDialog open={addDepartmentOpen} onOpenChange={setAddDepartmentOpen} />

      <LocationDialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen} editingLocation={editingLocation} />

      <AlertDialog open={!!pendingEmployee} onOpenChange={(open) => !open && setPendingEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingEmployee?.isActive ? "Deactivate employee?" : "Reactivate employee?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingEmployee?.isActive
                ? `${pendingEmployee?.name} will no longer be able to sign in or mark attendance. Their attendance and leave history is kept, and you can reactivate them at any time.`
                : `${pendingEmployee?.name} will regain access and be able to sign in and mark attendance again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingEmployee) return;
                deactivateEmployee.mutate({
                  id: pendingEmployee.id,
                  data: { isActive: !pendingEmployee.isActive },
                });
              }}
              disabled={deactivateEmployee.isPending}
            >
              {pendingEmployee?.isActive ? "Deactivate" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingDeleteDepartment}
        onOpenChange={(open) => !open && setPendingDeleteDepartment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{pendingDeleteDepartment?.name}". Departments with employees still
              assigned to them can't be deleted — reassign those employees first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingDeleteDepartment) return;
                deleteDepartment.mutate({ id: pendingDeleteDepartment.id });
              }}
              disabled={deleteDepartment.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingDeleteLocation} onOpenChange={(open) => !open && setPendingDeleteLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{pendingDeleteLocation?.name}". Locations still assigned to employees
              can't be deleted — reassign those employees first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingDeleteLocation) return;
                deleteLocation.mutate({ id: pendingDeleteLocation.id });
              }}
              disabled={deleteLocation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
