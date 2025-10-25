"use client";

import type { Shift, UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface ShiftManagementTabProps {
    shifts: Shift[];
    profiles: UserProfile[];
    onCancelBooking: (shiftId: string) => void;
}

export default function ShiftManagementTab({ shifts, profiles, onCancelBooking }: ShiftManagementTabProps) {
    
    const getBookedByName = (userId: string | undefined | null) => {
        if (!userId) return 'N/A';
        const profile = profiles.find(p => p.id === userId);
        return profile ? profile.name : 'Unknown User';
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>All Shifts</CardTitle>
                <CardDescription>View and manage all shifts in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Booked By</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shifts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No shifts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            shifts.map((shift) => (
                                <TableRow key={shift.id}>
                                    <TableCell>{format(shift.date instanceof Timestamp ? shift.date.toDate() : new Date(shift.date as string), 'yyyy-MM-dd')}</TableCell>
                                    <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                                    <TableCell className="capitalize">{shift.role}</TableCell>
                                    <TableCell>
                                        <Badge variant={shift.status === 'booked' ? 'secondary' : 'outline'}>
                                            {shift.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{shift.status === 'booked' ? getBookedByName(shift.bookedBy) : 'N/A'}</TableCell>
                                    <TableCell>
                                        {shift.status === 'booked' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onCancelBooking(shift.id)}
                                            >
                                                Cancel Booking
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
