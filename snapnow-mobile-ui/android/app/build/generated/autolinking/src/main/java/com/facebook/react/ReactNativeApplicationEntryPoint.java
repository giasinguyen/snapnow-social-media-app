package com.facebook.react;

import android.app.Application;
import android.content.Context;
import android.content.res.Resources;

import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger;
import com.facebook.react.views.view.WindowUtilKt;
import com.facebook.react.soloader.OpenSourceMergedSoMapping;
import com.facebook.soloader.SoLoader;

import java.io.IOException;

/**
  * This class is the entry point for loading React Native using the configuration
  * that the users specifies in their .gradle files.
  *
  * The `loadReactNative(this)` method invocation should be called inside the
  * application onCreate otherwise the app won't load correctly.            
  */
public class ReactNativeApplicationEntryPoint {
  public static void loadReactNative(Context context) {
    try {
       SoLoader.init(context, OpenSourceMergedSoMapping.INSTANCE);
    } catch (IOException error) {
      throw new RuntimeException(error);
    }
    
    if (com.haphu2512.snapnowmobileui.BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      DefaultNewArchitectureEntryPoint.load();
    }
    
    if (com.haphu2512.snapnowmobileui.BuildConfig.IS_EDGE_TO_EDGE_ENABLED) {
      WindowUtilKt.setEdgeToEdgeFeatureFlagOn();
    }
  }
}