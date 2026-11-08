import { Navigate, Route, Routes } from 'react-router-dom'
import { ProfessorLayout } from '@/layouts/ProfessorLayout'
import { StudentLayout } from '@/layouts/StudentLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfessorDashboardPage } from '@/pages/ProfessorDashboardPage'
import { AnnouncementDetailPage } from '@/pages/AnnouncementDetailPage'
import { ProfessorAnnouncementsPage, StudentAnnouncementsPage } from '@/pages/AnnouncementsPage'
import { ActivityDetailPage } from '@/pages/ActivityDetailPage'
import { ActivitiesPage } from '@/pages/ActivitiesPage'
import { RoleLoginPage } from '@/pages/RoleLoginPage'
import { ProfessorAttendancePage } from '@/pages/ProfessorAttendancePage'
import { StudentAttendancePage } from '@/pages/StudentAttendancePage'
import { StudentDashboardPage } from '@/pages/StudentDashboardPage'
import { RequireRole } from '@/routes/RequireRole'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleLoginPage role="student" />} />

      <Route path="/professor/login" element={<RoleLoginPage role="professor" />} />
      <Route path="/student/login" element={<RoleLoginPage role="student" />} />

      <Route element={<RequireRole role="professor" />}>
        <Route path="/professor" element={<ProfessorLayout />}>
          <Route index element={<Navigate to="/professor/dashboard" replace />} />
          <Route
            path="dashboard"
            element={<ProfessorDashboardPage />}
            handle={{ title: 'Dashboard' }}
          />
          <Route
            path="attendance"
            element={<ProfessorAttendancePage />}
            handle={{ title: 'Attendance' }}
          />
          <Route
            path="announcements"
            element={<ProfessorAnnouncementsPage />}
            handle={{ title: 'Announcements' }}
          />
          <Route
            path="announcements/:announcementId"
            element={<AnnouncementDetailPage />}
            handle={{ title: 'Announcement' }}
          />
          <Route
            path="activities"
            element={<ActivitiesPage />}
            handle={{ title: 'Activities' }}
          />
          <Route
            path="activities/:activityId"
            element={<ActivityDetailPage />}
            handle={{ title: 'Activity' }}
          />
        </Route>
      </Route>

      <Route element={<RequireRole role="student" />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route
            path="dashboard"
            element={<StudentDashboardPage />}
            handle={{ title: 'Dashboard' }}
          />
          <Route
            path="attendance"
            element={<StudentAttendancePage />}
            handle={{ title: 'My attendance' }}
          />
          <Route
            path="announcements"
            element={<StudentAnnouncementsPage />}
            handle={{ title: 'Announcements' }}
          />
          <Route
            path="announcements/:announcementId"
            element={<AnnouncementDetailPage />}
            handle={{ title: 'Announcement' }}
          />
          <Route
            path="activities"
            element={<ActivitiesPage />}
            handle={{ title: 'Activities' }}
          />
          <Route
            path="activities/:activityId"
            element={<ActivityDetailPage />}
            handle={{ title: 'Activity' }}
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
