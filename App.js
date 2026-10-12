import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './screens/LoginScreen';
import OtpScreen from './screens/OtpScreen';
import HomeScreen from './screens/HomeScreen';
import LocationScreen from './screens/LocationScreen';
import MyRidesScreen from './screens/MyRidesScreen';
import RideDetailScreen from './screens/RideDetailScreen';
import ScanScreen from './screens/ScanScreen';
import UnlockingScreen from './screens/UnlockingScreen';
import BluetoothScreen from './screens/BluetoothScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import KycScreen from './screens/KycScreen';
import ReferScreen from './screens/ReferScreen';
import OffersScreen from './screens/OffersScreen';
import HelpScreen from './screens/HelpScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import AboutScreen from './screens/AboutScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import TransactionScreen from './screens/TransactionScreen';
import InsightsScreen from './screens/InsightsScreen';
import SecurityScreen from './screens/SecurityScreen';
import BmsScreen from './screens/BmsScreen';
import WalletScreen from './screens/WalletScreen';
import VehicleDetailsScreen from './screens/VehicleDetailsScreen';
import VehicleListScreen from './screens/VehicleListScreen';
import RentScreen from './screens/RentScreen';
import PayScreen from './screens/PayScreen';
import BookingConfirmedScreen from './screens/BookingConfirmedScreen';
import RideScreen from './screens/RideScreen';
import EndRideScreen from './screens/EndRideScreen';
import WalletIntro from './components/WalletIntro';
import { apiGet, apiPost, last10 } from './services/api';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [phone, setPhone] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [walletIntro, setWalletIntro] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [vehicleFrom, setVehicleFrom] = useState('home');
  const [trip, setTrip] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [rideSummary, setRideSummary] = useState(null);
  const [pastRide, setPastRide] = useState(null);
  const [rideFrom, setRideFrom] = useState('booked');
  const [unlockFrom, setUnlockFrom] = useState('scan');
  const [unlockScooter, setUnlockScooter] = useState(null);
  const [profile, setProfile] = useState({
    name: 'Demo Reviewer',
    phone: '+91 9999999999',
    gender: '',
    dob: '',
    address: '',
  });
  const [kyc, setKyc] = useState({ selfie: false, front: false, back: false });
  const [offersFrom, setOffersFrom] = useState('profile');
  const [prefs, setPrefs] = useState({ push: true, email: false });
  const [tx, setTx] = useState(null);
  const [notes, setNotes] = useState([
    {
      id: 'wallet',
      kind: 'Wallet',
      title: 'Wallet top-up',
      text: 'Your Razorpay top-up is in.',
      time: '28 Aug 2026',
      read: false,
    },
    {
      id: 'ride',
      kind: 'Rides',
      title: 'Ride confirmed',
      text: 'Your Evegah City reservation in Gotri is ready for pickup.',
      time: '28 Aug 2026',
      read: false,
    },
    {
      id: 'battery',
      kind: 'System',
      title: 'Battery is low',
      text: 'The scooter is at 18%. Swap at the nearest Evegah station.',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 'offer',
      kind: 'Offers',
      title: 'EVE20 is ready',
      text: '₹40 off this ride. Apply it at checkout.',
      time: 'Yesterday',
      read: false,
    },
    {
      id: 'zones',
      kind: 'System',
      title: 'Zones are open',
      text: 'Gotri, Manjalpur, Aatapi, and KPGU are open.',
      time: '2 days ago',
      read: true,
    },
  ]);

  const openWallet = () => {
    if (walletIntro || screen === 'wallet') return;
    setWalletIntro(true);
  };

  return (
    <SafeAreaProvider>
      <View style={styles.stage}>
      {screen === 'rent' || screen === 'pay' || screen === 'booked' || screen === 'ride' || screen === 'ended' ? (
        <View style={styles.stage}>
          <RentScreen
            vehicle={vehicle}
            onBack={() => setScreen('vehicle')}
            onContinue={(next) => {
              setTrip(next);
              setScreen('pay');
            }}
          />
          {screen === 'pay' || screen === 'booked' || screen === 'ride' || screen === 'ended' ? (
            <View style={styles.cover}>
              <PayScreen
                vehicle={vehicle}
                trip={trip}
                onBack={() => setScreen('rent')}
                onPay={(next) => {
                  const tail = Date.now().toString().slice(-8);
                  setReceipt({ ...next, bookingId: `EVG${tail}` });
                  setScreen('booked');
                }}
              />
            </View>
          ) : null}
          {screen === 'booked' || screen === 'ride' || screen === 'ended' ? (
            <View style={styles.booked}>
              <BookingConfirmedScreen
                vehicle={vehicle}
                trip={trip}
                receipt={receipt}
                onBack={() => setScreen('pay')}
                onStart={() => {
                  setRideFrom('booked');
                  setScreen('ride');
                }}
              />
            </View>
          ) : null}
          {screen === 'ride' || screen === 'ended' ? (
            <View style={styles.ride}>
              <RideScreen
                vehicle={vehicle}
                trip={trip}
                receipt={receipt}
                onBack={() => setScreen(rideFrom)}
                onEnd={(summary) => {
                  setRideSummary(summary);
                  setScreen('ended');
                }}
              />
            </View>
          ) : null}
          {screen === 'ended' ? (
            <View style={styles.ended}>
              <EndRideScreen
                vehicle={vehicle}
                trip={trip}
                receipt={receipt}
                summary={rideSummary}
                onDone={() => setScreen('home')}
              />
            </View>
          ) : null}
        </View>
      ) : screen === 'vehicleList' ? (
        <View style={styles.stage}>
          <VehicleListScreen
            onBack={() => setScreen('home')}
            onOpenLocation={() => setLocationOpen(true)}
            onSelectVehicle={(next) => {
              setVehicle(next);
              setVehicleFrom('vehicleList');
              setScreen('vehicle');
            }}
          />
          <Modal
            visible={locationOpen}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent
            onRequestClose={() => setLocationOpen(false)}
          >
            <LocationScreen onBack={() => setLocationOpen(false)} />
          </Modal>
        </View>
      ) : screen === 'vehicle' ? (
        <VehicleDetailsScreen
          vehicle={vehicle}
          onBack={() => setScreen(vehicleFrom)}
          onBook={() => setScreen('rent')}
        />
      ) : screen === 'bms' ? (
        <BmsScreen onBack={() => setScreen('home')} />
      ) : screen === 'security' ? (
        <SecurityScreen
          phone={profile.phone}
          onBack={() => setScreen('profile')}
          onLogout={() => setScreen('login')}
        />
      ) : screen === 'insights' ? (
        <InsightsScreen onBack={() => setScreen('home')} />
      ) : screen === 'transaction' ? (
        <TransactionScreen tx={tx} onBack={() => setScreen('wallet')} />
      ) : screen === 'wallet' ? (
        <WalletScreen
          enterCards={false}
          onOpenHome={() => setScreen('home')}
          onOpenMyRide={() => setScreen('rides')}
          onOpenScan={() => setScreen('scan')}
          onOpenProfile={() => setScreen('profile')}
          onOffers={() => {
            setOffersFrom('wallet');
            setScreen('offers');
          }}
          onOpenTx={(item) => {
            setTx(item);
            setScreen('transaction');
          }}
          phone={profile.phone}
        />
      ) : screen === 'notifications' ? (
        <NotificationsScreen
          notes={notes}
          phone={profile.phone}
          onBack={() => setScreen('home')}
          onRead={(id) => setNotes((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)))}
          onReadAll={() => setNotes((list) => list.map((item) => ({ ...item, read: true })))}
        />
      ) : screen === 'about' ? (
        <AboutScreen onBack={() => setScreen('profile')} onExplore={() => setScreen('home')} />
      ) : screen === 'preferences' ? (
        <PreferencesScreen
          prefs={prefs}
          onChange={setPrefs}
          onBack={() => setScreen('profile')}
        />
      ) : screen === 'help' ? (
        <HelpScreen onBack={() => setScreen('profile')} />
      ) : screen === 'offers' ? (
        <OffersScreen onBack={() => setScreen(offersFrom)} />
      ) : screen === 'refer' ? (
        <ReferScreen
          phone={profile.phone}
          name={profile.name}
          onBack={() => setScreen('profile')}
        />
      ) : screen === 'kyc' ? (
        <KycScreen
          kyc={kyc}
          onBack={() => setScreen('profile')}
          onStep={(key) => setKyc((current) => ({ ...current, [key]: true }))}
        />
      ) : screen === 'editProfile' ? (
        <EditProfileScreen
          profile={profile}
          onBack={() => setScreen('profile')}
          onSave={(next) => {
            setProfile(next);
            setScreen('profile');
            apiPost('/renters', {
              rider_name: next.name,
              mobile: next.phone,
              gender: next.gender,
              date_of_birth: next.dob,
              address: next.address,
            }).catch(() => {});
          }}
        />
      ) : screen === 'profile' ? (
        <ProfileScreen
          profile={profile}
          verified={kyc.selfie && kyc.front && kyc.back}
          onEdit={() => setScreen('editProfile')}
          onKyc={() => setScreen('kyc')}
          onRefer={() => setScreen('refer')}
          onOffers={() => {
            setOffersFrom('profile');
            setScreen('offers');
          }}
          onHelp={() => setScreen('help')}
          onPreferences={() => setScreen('preferences')}
          onAbout={() => setScreen('about')}
          onSecurity={() => setScreen('security')}
          onOpenHome={() => setScreen('home')}
          onOpenMyRide={() => setScreen('rides')}
          onOpenScan={() => setScreen('scan')}
          onOpenWallet={openWallet}
        />
      ) : screen === 'bluetooth' ? (
        <BluetoothScreen
          onBack={() => setScreen('scan')}
          onUnlock={(scooter) => {
            setUnlockFrom('bluetooth');
            setUnlockScooter(scooter);
            setScreen('unlocking');
          }}
        />
      ) : screen === 'unlocking' ? (
        <UnlockingScreen
          scooter={unlockScooter}
          onBack={() => setScreen(unlockFrom)}
          onStart={() => {
            setRideFrom('unlocking');
            const code = unlockScooter?.code || 'EV-1042';
            if (!trip) {
              const start = Date.now();
              setTrip({
                pickupName: 'Gotri',
                dropName: 'Gotri',
                pickupAt: start,
                dropAt: start + 2 * 60 * 60 * 1000,
              });
            }
            if (!receipt) setReceipt({ bookingId: code.replace('-', '') });
            setScreen('ride');
          }}
        />
      ) : screen === 'scan' ? (
        <ScanScreen
          onOpenHome={() => setScreen('home')}
          onOpenMyRide={() => setScreen('rides')}
          onOpenProfile={() => setScreen('profile')}
          onOpenWallet={openWallet}
          onFindNearby={() => {
            setScreen('home');
            setLocationOpen(true);
          }}
          onScan={() => {
            setUnlockFrom('scan');
            setUnlockScooter(null);
            setScreen('unlocking');
          }}
          onBluetooth={() => setScreen('bluetooth')}
        />
      ) : screen === 'rideDetail' ? (
        <RideDetailScreen ride={pastRide} onBack={() => setScreen('rides')} />
      ) : screen === 'rides' ? (
        <MyRidesScreen
          onOpenHome={() => setScreen('home')}
          onOpenScan={() => setScreen('scan')}
          onOpenProfile={() => setScreen('profile')}
          onOpenWallet={openWallet}
          onOpenRide={(item) => {
            setPastRide(item);
            setScreen('rideDetail');
          }}
          phone={profile.phone}
        />
      ) : screen === 'home' ? (
        <View style={styles.stage}>
          <HomeScreen
            onOpenLocation={() => setLocationOpen(true)}
            onOpenMyRide={() => setScreen('rides')}
            onOpenScan={() => setScreen('scan')}
            onOpenProfile={() => setScreen('profile')}
            onOpenWallet={openWallet}
            onOpenVehicleList={() => setScreen('vehicleList')}
            onOpenVehicle={(next) => {
              setVehicle(next);
              setVehicleFrom('home');
              setScreen('vehicle');
            }}
            onOpenNotifications={() => setScreen('notifications')}
            onOpenInsights={() => setScreen('insights')}
            onOpenBms={() => setScreen('bms')}
            hasUnread={notes.some((item) => !item.read)}
          />
          <Modal
            visible={locationOpen}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent
            onRequestClose={() => setLocationOpen(false)}
          >
            <LocationScreen onBack={() => setLocationOpen(false)} />
          </Modal>
        </View>
      ) : screen === 'otp' ? (
        <OtpScreen
          phone={phone}
          onEdit={() => setScreen('login')}
          onSuccess={() => {
            const mobile = last10(phone);
            if (mobile) {
              apiGet(`/renters/check-mobile/${mobile}`)
                .then((body) => {
                  const renter = body?.renter;
                  if (!renter) return;
                  setProfile((current) => ({
                    ...current,
                    name: renter.rider_name || renter.name || current.name,
                    phone: renter.mobile || current.phone,
                    gender: renter.gender || current.gender,
                    dob: renter.date_of_birth || current.dob,
                    address: renter.address || renter.present_address || current.address,
                  }));
                  const kycStatus = String(renter.kyc_status || '').toLowerCase();
                  if (kycStatus.includes('approv') || kycStatus.includes('verif')) {
                    setKyc({ selfie: true, front: true, back: true });
                  }
                })
                .catch(() => {});
            }
            setScreen('home');
          }}
        />
      ) : (
        <LoginScreen
          onContinue={(nextPhone) => {
            setPhone(nextPhone);
            setScreen('otp');
          }}
        />
      )}
      {walletIntro ? (
        <WalletIntro
          active={screen}
          onOpenHome={() => setScreen('home')}
          onOpenMyRide={() => setScreen('rides')}
          onOpenScan={() => setScreen('scan')}
          onOpenProfile={() => setScreen('profile')}
          onOpen={() => setScreen('wallet')}
          onDone={() => setWalletIntro(false)}
        />
      ) : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    elevation: 8,
  },
  booked: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    elevation: 12,
  },
  ride: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 7,
    elevation: 16,
  },
  ended: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 8,
    elevation: 20,
  },
});
