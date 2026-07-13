import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ManageCourses from './pages/ManageCourses';
import ManageUsers from './pages/ManageUsers';
import ManageSessions from './pages/ManageSessions';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManagePayments from './pages/ManagePayments';
import ManageEnrollments from './pages/ManageEnrollments';
import StudentDashboard from './pages/StudentDashboard';
import TeacherAttendance from './pages/TeacherAttendance';
import StudentPayments from './pages/StudentPayments';
import StudentAttendance from './pages/StudentAttendance';
import ManageAttendance from './pages/ManageAttendance';
import ManageTeacherAttendance from './pages/ManageTeacherAttendance';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ManageAnnouncements from './pages/ManageAnnouncements';
import TeacherGradeBook from './pages/TeacherGradeBook';
import StudentProgress from './pages/StudentProgress';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Wrapped Protected Routes inside the Layout */}
          <Route element={<Layout />}>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/announcements" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageAnnouncements />
              </ProtectedRoute>
            } />
            <Route path="/admin/courses" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageCourses />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/sessions" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageSessions />
              </ProtectedRoute>
            } />

            <Route path="/admin/enrollments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageEnrollments />
              </ProtectedRoute>
            } />

            <Route path="/admin/payments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManagePayments />
              </ProtectedRoute>
            } />

            <Route path="/admin/attendance" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageAttendance />
              </ProtectedRoute>
            } />

            <Route path="/admin/teacher-attendance" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageTeacherAttendance />
              </ProtectedRoute>
            } />

            {/* Teacher Routes */}
            <Route path="/teacher" element={
              <ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>
            } />
            <Route path="/teacher/attendance" element={
              <ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>
            } />
            <Route path="/teacher/gradebook" element={
              <ProtectedRoute allowedRoles={['teacher']}><TeacherGradeBook /></ProtectedRoute>
            } />
            <Route path="/teacher/courses" element={
              <ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>
            } />

            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
            } />
            <Route path="/student/progress" element={
              <ProtectedRoute allowedRoles={['student']}><StudentProgress /></ProtectedRoute>
            } />
            <Route path="/student/payments" element={
              <ProtectedRoute allowedRoles={['student']}><StudentPayments /></ProtectedRoute>
            } />
            <Route path="/student/attendance" element={
              <ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>
            } />
            <Route path="/student/courses" element={
              <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
            } />

          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;