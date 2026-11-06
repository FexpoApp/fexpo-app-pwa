import { Route, Routes, Navigate } from 'react-router-dom';
import { Shell } from './ui/Shell';
import { HomePage } from './pages/Home';
import { MapPage } from './pages/Map';
import { CheckinPage } from './pages/Checkin';
import { MissionsPage, RewardsPage } from './pages/Missions';
import { ProfilePage } from './pages/Profile';
import { StandsPage, StandPage } from './pages/Stands';
import { QrPage, NotificationsPage, EventPage, NotFoundPage } from './pages/Secondary';
import { StandTagLink } from './pages/LiveCheckin';
import { LocalEntry } from './pages/Welcome';
import { DiscoverPage } from './pages/Discover';
import { NFC_ENABLED } from './services/config';
import { NfcProbe } from './pages/NfcProbe';
import { GamlpSectorPage } from './pages/Sector';
import { PhotoCompaniesPage, PhotoCompanyPage } from './pages/Companies';
import { FairShell } from './features/events/FairShell';
import {
  FairSelectionPage,
  PucHomePage,
  PucRoutePage,
  PucExperiencePage,
  PucAccountPage,
  PucNotFound,
  UnknownFairPage,
} from './features/events/Pages';
import { PucMapPage } from './features/events/Map';
import { PucRatingPage } from './features/events/Rating';
import { PucScannerPage } from './features/events/Scanner';
import { PucGoogleGate } from './features/events/GoogleGate';
import { PUC_BASE, FIPAZ_HOME } from './features/events/catalog';

export function App() {
  return (
    <Routes>
      <Route element={<FairShell />}>
        <Route index element={<FairSelectionPage />} />
        <Route path="cuenta" element={<PucAccountPage />} />
        <Route path="ferias" element={<Navigate to="/" replace />} />
        <Route path={PUC_BASE} element={<PucHomePage />} />
        <Route path={PUC_BASE + '/mapa'} element={<PucMapPage />} />
        <Route path={PUC_BASE + '/recorrido'} element={<PucRoutePage />} />
        <Route path={PUC_BASE + '/experiencias/:point'} element={<PucExperiencePage />} />
        <Route
          path={PUC_BASE + '/calificar/:point'}
          element={
            <PucGoogleGate purpose="rating">
              <PucRatingPage />
            </PucGoogleGate>
          }
        />
        <Route
          path={PUC_BASE + '/escanear'}
          element={
            <PucGoogleGate purpose="scanner">
              <PucScannerPage />
            </PucGoogleGate>
          }
        />
        <Route path={PUC_BASE + '/perfil'} element={<PucAccountPage />} />
        <Route path={PUC_BASE + '/*'} element={<PucNotFound />} />
        <Route path="ferias/:event/*" element={<UnknownFairPage />} />
      </Route>
      <Route element={<LocalEntry />}>
        <Route element={<Shell />}>
          <Route path={FIPAZ_HOME} element={<HomePage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="scan" element={<CheckinPage />} />
          <Route
            path="nfc-test"
            element={NFC_ENABLED ? <NfcProbe /> : <Navigate to="/scan" replace />}
          />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="missions" element={<MissionsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="stands" element={<StandsPage />} />
          <Route path="stands/:id" element={<StandPage />} />
          <Route path="companies" element={<PhotoCompaniesPage />} />
          <Route path="companies/:id" element={<PhotoCompanyPage />} />
          <Route path="sectors/gamlp" element={<GamlpSectorPage />} />
          <Route path="my-qr" element={<QrPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="events/:id" element={<EventPage />} />
          <Route path="check-in" element={<Navigate to="/scan" replace />} />
          <Route path="e/:event/s/:stand" element={<StandTagLink />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
