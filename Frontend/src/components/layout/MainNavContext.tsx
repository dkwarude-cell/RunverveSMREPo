/**
 * MainNavContext - lets any dock tab open the menu, switch tabs or open the profile.
 */
import { createContext, useContext } from 'react';
import type { TabKey } from '../../navigation/types';

type MainNav = {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  openMenu: () => void;
  openProfile: () => void;
};

export const MainNavContext = createContext<MainNav>({
  tab: 'home',
  setTab: () => {},
  openMenu: () => {},
  openProfile: () => {},
});

export const useMainNav = () => useContext(MainNavContext);
