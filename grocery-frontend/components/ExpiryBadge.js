import { View, Text, StyleSheet } from 'react-native';

export default function ExpiryBadge({ expiry_date }) {
  if (!expiry_date) return null;

  // Parse as local time (appending T00:00:00 avoids UTC off-by-one-day bug)
  const expiry = new Date(expiry_date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  const formatted = expiry.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (diffDays < 0) {
    return (
      <View style={[styles.badge, styles.expired]}>
        <Text style={styles.expiredText}>Expired · {formatted}</Text>
      </View>
    );
  }

  if (diffDays <= 3) {
    return (
      <View style={[styles.badge, styles.soon]}>
        <Text style={styles.soonText}>Expires soon · {formatted}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.fresh]}>
      <Text style={styles.freshText}>Expires {formatted}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  expired: {
    backgroundColor: '#fde8e8',
  },
  expiredText: {
    color: '#c0392b',
    fontSize: 11,
    fontWeight: '600',
  },
  soon: {
    backgroundColor: '#fff3e0',
  },
  soonText: {
    color: '#e67e22',
    fontSize: 11,
    fontWeight: '600',
  },
  fresh: {
    backgroundColor: '#eaf6ee',
  },
  freshText: {
    color: '#27ae60',
    fontSize: 11,
    fontWeight: '500',
  },
});
