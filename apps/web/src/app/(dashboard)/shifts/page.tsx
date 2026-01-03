'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus } from 'lucide-react';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'WEEKEND';
  warehouse: { name: string; code: string };
  employees: Array<{
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  }>;
  _count: { employees: number };
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'upcoming' | 'all'>('upcoming');

  useEffect(() => {
    fetchShifts();
  }, [view]);

  const fetchShifts = async () => {
    try {
      const params = new URLSearchParams();
      if (view === 'upcoming') {
        params.append('startDate', new Date().toISOString());
      }

      const res = await fetch(`/api/shifts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setShifts(data);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftTypeBadge = (type: string) => {
    const colors = {
      MORNING: 'bg-blue-100 text-blue-800',
      AFTERNOON: 'bg-yellow-100 text-yellow-800',
      NIGHT: 'bg-purple-100 text-purple-800',
      WEEKEND: 'bg-green-100 text-green-800',
    };
    return colors[type as keyof typeof colors] || colors.MORNING;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shift Management</h1>
          <p className="text-gray-600 mt-1">Schedule and manage employee shifts</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5 mr-2" />
          Create Shift
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('upcoming')}
          className={`px-4 py-2 rounded-lg ${
            view === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upcoming Shifts
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-lg ${
            view === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Shifts
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Shifts</p>
              <p className="text-2xl font-bold">{shifts.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff Assigned</p>
              <p className="text-2xl font-bold">
                {shifts.reduce((sum, shift) => sum + shift._count.employees, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Staff per Shift</p>
              <p className="text-2xl font-bold">
                {shifts.length > 0
                  ? Math.round(shifts.reduce((sum, s) => sum + s._count.employees, 0) / shifts.length)
                  : 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Shift Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">Loading...</div>
        ) : shifts.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500">No shifts found</div>
        ) : (
          shifts.map((shift) => {
            const start = formatDateTime(shift.startTime);
            const end = formatDateTime(shift.endTime);
            return (
              <div key={shift.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                    <p className="text-sm text-gray-600">{shift.warehouse.name}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getShiftTypeBadge(
                      shift.shiftType
                    )}`}
                  >
                    {shift.shiftType}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {start.date}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {start.time} - {end.time}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {shift._count.employees} employees assigned
                  </div>
                </div>

                {shift.employees.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-2">Assigned Staff:</p>
                    <div className="flex flex-wrap gap-1">
                      {shift.employees.slice(0, 3).map((emp) => (
                        <span key={emp.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {emp.firstName} {emp.lastName}
                        </span>
                      ))}
                      {shift.employees.length > 3 && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          +{shift.employees.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
