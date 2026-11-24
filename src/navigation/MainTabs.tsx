import React, { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MatchListScreen from '../screens/matches/MatchListScreen';
import UserDetailScreen from '../screens/matches/UserDetailScreen';
import RequestsScreen from '../screens/requests/RequestsScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import DiningHistoryScreen from '../screens/history/DiningHistoryScreen';
import BlockedUsersScreen from '../screens/profile/BlockedUsersScreen';
import UpdatesScreen from '../screens/updates/UpdatesScreen';
import { colors } from '../theme/colors';
import type { MatchCandidate } from '../services/matchService';
import { useAuth } from '../context/AuthContext';
import { subscribeToMyRequests } from '../services/requestService';
import { hasUnreadMessage, subscribeToMyChats } from '../services/chatService';
import type { Chat, FoodBuddyRequest } from '../types';

export type MatchesStackParamList = {
  MatchList: undefined;
  UserDetail: { candidate: MatchCandidate };
};

export type ChatsStackParamList = {
  ChatList: undefined;
  ChatRoom: { chatId: string; otherUserName: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  DiningHistory: undefined;
  BlockedUsers: undefined;
};

export type MainTabParamList = {
  MatchesTab: undefined;
  RequestsTab: undefined;
  ChatsTab: undefined;
  UpdatesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const MatchesStackNav = createNativeStackNavigator<MatchesStackParamList>();
const ChatsStackNav = createNativeStackNavigator<ChatsStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.card },
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '600' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

function MatchesStack() {
  return (
    <MatchesStackNav.Navigator screenOptions={stackScreenOptions}>
      <MatchesStackNav.Screen
        name="MatchList"
        component={MatchListScreen}
        options={{ title: 'Find a Food Buddy' }}
      />
      <MatchesStackNav.Screen
        name="UserDetail"
        component={UserDetailScreen}
        options={{ title: 'Profile' }}
      />
    </MatchesStackNav.Navigator>
  );
}

function ChatsStack() {
  return (
    <ChatsStackNav.Navigator screenOptions={stackScreenOptions}>
      <ChatsStackNav.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Chats' }} />
      <ChatsStackNav.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={({ route }) => ({ title: route.params.otherUserName })}
      />
    </ChatsStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={stackScreenOptions}>
      <ProfileStackNav.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <ProfileStackNav.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <ProfileStackNav.Screen
        name="DiningHistory"
        component={DiningHistoryScreen}
        options={{ title: 'Buddy History' }}
      />
      <ProfileStackNav.Screen name="BlockedUsers" component={BlockedUsersScreen} options={{ title: 'Blocked Users' }} />
    </ProfileStackNav.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  MatchesTab: '🍽️',
  RequestsTab: '🤝',
  ChatsTab: '💬',
  UpdatesTab: '🔔',
  ProfileTab: '👤',
};

export default function MainTabs() {
  const { firebaseUser } = useAuth();
  const [requests, setRequests] = useState<FoodBuddyRequest[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeToMyRequests(firebaseUser.uid, setRequests);
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeToMyChats(firebaseUser.uid, setChats);
  }, [firebaseUser]);

  const pendingIncomingCount = useMemo(
    () => requests.filter((request) => request.recipient_id === firebaseUser?.uid && request.status === 'pending').length,
    [requests, firebaseUser]
  );
  const unreadChatCount = useMemo(
    () => firebaseUser ? chats.filter((chat) => hasUnreadMessage(chat, firebaseUser.uid)).length : 0,
    [chats, firebaseUser]
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: () => (
          <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name as keyof MainTabParamList]}</Text>
        ),
        tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 7, borderTopColor: colors.border, backgroundColor: colors.card, elevation: 0 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="MatchesTab" component={MatchesStack} options={{ title: 'Matches' }} />
      <Tab.Screen name="RequestsTab" component={RequestsScreen} options={{ title: 'Requests' }} />
      <Tab.Screen
        name="ChatsTab"
        component={ChatsStack}
        options={{
          title: 'Chats',
          tabBarBadge: unreadChatCount || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: '#fff', fontSize: 10, minWidth: 17, height: 17 },
        }}
      />
      <Tab.Screen
        name="UpdatesTab"
        component={UpdatesScreen}
        options={{
          title: 'Updates',
          tabBarBadge: pendingIncomingCount || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: '#fff', fontSize: 10, minWidth: 17, height: 17 },
        }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
