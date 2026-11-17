import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocationTracking } from '../hooks';

export const HomeScreen: React.FC = () => {
  // Use existing custom location tracking hook as single source of tracking truth
  const {
    isTracking,
    latitude,
    longitude,
    isLoading,
    error,
    startTracking,
    stopTracking,
  } = useLocationTracking();

  // Local UI state placeholders for push notifications and battery (to be integrated in future phases)
  const [notificationStatus, setNotificationStatus] = useState<string>(
    'Status: Idle - No notifications triggered',
  );
  const [batteryLevel, setBatteryLevel] = useState<string>('--%');
  const [batteryStatus, setBatteryStatus] = useState<string>(
    'Last checked: Not checked yet',
  );

  const handleTestNotification = () => {
    const time = new Date().toLocaleTimeString();
    setNotificationStatus(`Notification sent at ${time} (Simulated)`);
  };

  const handleRefreshBattery = () => {
    const simulatedBattery = Math.floor(Math.random() * 20 + 80);
    setBatteryLevel(`${simulatedBattery}%`);
    setBatteryStatus(`Last checked: ${new Date().toLocaleTimeString()} (Simulated)`);
  };

  const formattedLatitude =
    latitude !== null ? latitude.toFixed(6) : '--.------';
  const formattedLongitude =
    longitude !== null ? longitude.toFixed(6) : '--.------';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Mobile Client</Text>
        </View>
        <Text style={styles.title}>Location & Notifications</Text>
        <Text style={styles.subtitle}>
          Track real-time device coordinates, monitor sync status, and manage periodic updates.
        </Text>
      </View>

      {/* 2. Activity Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Activity Status</Text>
          <View
            style={[
              styles.statusPill,
              isTracking && !error ? styles.pillActive : styles.pillInactive,
            ]}>
            <View
              style={[
                styles.statusDot,
                isTracking && !error ? styles.dotActive : styles.dotDisconnected,
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                isTracking && !error ? styles.textActive : styles.textInactive,
              ]}>
              {isTracking && !error ? 'Connected' : 'Not Connected'}
            </Text>
          </View>
        </View>
        <Text style={styles.helperText}>
          Backend sync status and connection heartbeat.
        </Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Server Connection:</Text>
          <Text style={styles.statusValue}>
            {isTracking && !error ? 'Syncing Coordinates' : 'Idle / Not Connected'}
          </Text>
        </View>
      </View>

      {/* 3. Location Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Location Tracking</Text>
          <View
            style={[
              styles.statusPill,
              isTracking ? styles.pillActive : styles.pillInactive,
            ]}>
            <View
              style={[
                styles.statusDot,
                isTracking ? styles.dotActive : styles.dotInactive,
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                isTracking ? styles.textActive : styles.textInactive,
              ]}>
              {isTracking ? 'Tracking Active' : 'Not Tracking'}
            </Text>
          </View>
        </View>

        <Text style={styles.helperText}>
          Monitors foreground geolocation coordinates every ~4 seconds.
        </Text>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>
              Acquiring location permission and GPS fix...
            </Text>
          </View>
        )}

        {/* Error Feedback */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Coordinates Display */}
        <View style={styles.coordinatesContainer}>
          <View style={styles.coordinateBox}>
            <Text style={styles.coordinateLabel}>LATITUDE</Text>
            <Text style={styles.coordinateValue}>{formattedLatitude}</Text>
          </View>
          <View style={styles.coordinateBox}>
            <Text style={styles.coordinateLabel}>LONGITUDE</Text>
            <Text style={styles.coordinateValue}>{formattedLongitude}</Text>
          </View>
        </View>

        {/* Tracking Control Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              (isTracking || isLoading) && styles.buttonDisabled,
            ]}
            disabled={isTracking || isLoading}
            onPress={startTracking}
            activeOpacity={0.7}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  styles.primaryButtonText,
                  (isTracking || isLoading) && styles.buttonDisabledText,
                ]}>
                Start Tracking
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.stopButton,
              !isTracking && styles.buttonDisabled,
            ]}
            disabled={!isTracking}
            onPress={stopTracking}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.buttonText,
                styles.stopButtonText,
                !isTracking && styles.buttonDisabledText,
              ]}>
              Stop Tracking
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Push Notification Section (Placeholder) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Push Notifications</Text>
        </View>
        <Text style={styles.helperText}>
          Simulate a local push notification alert to verify permissions and UI responses.
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.actionButton]}
          onPress={handleTestNotification}
          activeOpacity={0.7}>
          <Text style={[styles.buttonText, styles.actionButtonText]}>
            Test Notification
          </Text>
        </TouchableOpacity>

        <View style={styles.notificationStatusContainer}>
          <Text style={styles.notificationStatusText}>
            {notificationStatus}
          </Text>
        </View>
      </View>

      {/* 5. Battery Section (Placeholder) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Battery Status</Text>
          <Text style={styles.batteryValue}>{batteryLevel}</Text>
        </View>
        <Text style={styles.helperText}>
          Current battery state reported with location updates.
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRefreshBattery}
          activeOpacity={0.7}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Refresh Battery
          </Text>
        </TouchableOpacity>

        <Text style={styles.batteryStatusSubtext}>{batteryStatus}</Text>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Mini Location & Push Notification App • Mobile Client
        </Text>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  pillActive: {
    backgroundColor: '#DCFCE7',
  },
  pillInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: '#16A34A',
  },
  dotInactive: {
    backgroundColor: '#94A3B8',
  },
  dotDisconnected: {
    backgroundColor: '#EA580C',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  textActive: {
    color: '#15803D',
  },
  textInactive: {
    color: '#64748B',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  loadingText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    textAlign: 'center',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coordinateBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coordinateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  coordinateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563EB',
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#DC2626',
  },
  actionButton: {
    backgroundColor: '#0F172A',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#E2E8F0',
    borderColor: '#E2E8F0',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  stopButtonText: {
    color: '#FFFFFF',
  },
  actionButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#334155',
  },
  buttonDisabledText: {
    color: '#94A3B8',
  },
  notificationStatusContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  notificationStatusText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
  batteryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  batteryStatusSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  footer: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
