if(NOT TARGET react-native-worklets::worklets)
add_library(react-native-worklets::worklets SHARED IMPORTED)
set_target_properties(react-native-worklets::worklets PROPERTIES
    IMPORTED_LOCATION "E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/node_modules/react-native-worklets/android/build/intermediates/cxx/Debug/3p436g2k/obj/x86/libworklets.so"
    INTERFACE_INCLUDE_DIRECTORIES "E:/1.HK1_2025/ReactNative/deTai/snapnow-social-media-app/snapnow-mobile-ui/node_modules/react-native-worklets/android/build/prefab-headers/worklets"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

