if(NOT TARGET react-native-reanimated::reanimated)
add_library(react-native-reanimated::reanimated SHARED IMPORTED)
set_target_properties(react-native-reanimated::reanimated PROPERTIES
    IMPORTED_LOCATION "E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/node_modules/react-native-reanimated/android/build/intermediates/cxx/Debug/20o2k736/obj/x86/libreanimated.so"
    INTERFACE_INCLUDE_DIRECTORIES "E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/node_modules/react-native-reanimated/android/build/prefab-headers/reanimated"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

