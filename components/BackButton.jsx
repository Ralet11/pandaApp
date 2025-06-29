// components/BackButton.jsx
import { TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BackButton({ color = "#F5F5DC" }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { top: insets.top + 10 }          // respeta el notch/status bar
      ]}
      onPress={() => navigation.goBack()}
      activeOpacity={0.7}
    >
      <Feather name="arrow-left" size={22} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    left: 15,
    zIndex: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(10,12,16,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});
