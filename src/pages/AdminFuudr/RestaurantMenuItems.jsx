import { useParams } from 'react-router-dom';
import MenuManager from '../Partner/Dashboard/MenuManager';

export default function RestaurantMenuItems() {
  const { id } = useParams();
  return <MenuManager user={{ id }} />;
}
