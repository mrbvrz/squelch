#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AudioOutputDevice {
    pub id: String,
    pub name: String,
    pub transport: String,
    pub is_default: bool,
}

#[cfg(target_os = "macos")]
pub mod core_audio {
    use std::ptr;

    #[link(name = "CoreAudio", kind = "framework")]
    #[link(name = "CoreFoundation", kind = "framework")]
    unsafe extern "C" {
        fn AudioObjectGetPropertyDataSize(
            in_object_id: u32,
            in_address: *const AudioObjectPropertyAddress,
            in_qualifier_data_size: u32,
            in_qualifier_data: *const std::ffi::c_void,
            out_data_size: *mut u32,
        ) -> i32;

        fn AudioObjectGetPropertyData(
            in_object_id: u32,
            in_address: *const AudioObjectPropertyAddress,
            in_qualifier_data_size: u32,
            in_qualifier_data: *const std::ffi::c_void,
            io_data_size: *mut u32,
            out_data: *mut std::ffi::c_void,
        ) -> i32;

        fn CFStringGetLength(the_string: *const std::ffi::c_void) -> isize;
        fn CFStringGetCString(
            the_string: *const std::ffi::c_void,
            buffer: *mut u8,
            buffer_size: isize,
            encoding: u32,
        ) -> bool;
        fn CFRelease(cf: *const std::ffi::c_void);
    }

    #[repr(C)]
    struct AudioObjectPropertyAddress {
        m_selector: u32,
        m_scope: u32,
        m_element: u32,
    }

    fn get_cf_str(id: u32, sel: [u8; 4]) -> Option<String> {
        let addr = AudioObjectPropertyAddress {
            m_selector: u32::from_be_bytes(sel),
            m_scope: u32::from_be_bytes(*b"glob"),
            m_element: 0,
        };
        let mut cf: *const std::ffi::c_void = ptr::null();
        let mut size = std::mem::size_of::<*const std::ffi::c_void>() as u32;
        unsafe {
            let res = AudioObjectGetPropertyData(
                id,
                &addr,
                0,
                ptr::null(),
                &mut size,
                &mut cf as *mut _ as *mut _,
            );
            if res == 0 && !cf.is_null() {
                let len = CFStringGetLength(cf);
                let mut buf = vec![0u8; (len * 4 + 1) as usize];
                let ok = CFStringGetCString(cf, buf.as_mut_ptr(), buf.len() as isize, 0x08000100);
                CFRelease(cf);
                if ok {
                    if let Ok(c_str) = std::ffi::CStr::from_bytes_until_nul(&buf) {
                        return Some(c_str.to_string_lossy().trim().to_string());
                    }
                }
            }
        }
        None
    }

    pub fn list_output_devices() -> Vec<super::AudioOutputDevice> {
        let mut results = vec![super::AudioOutputDevice {
            id: "default".to_string(),
            name: "Bawaan Sistem (macOS Default)".to_string(),
            transport: "system".to_string(),
            is_default: true,
        }];

        let default_addr = AudioObjectPropertyAddress {
            m_selector: u32::from_be_bytes(*b"defo"),
            m_scope: u32::from_be_bytes(*b"glob"),
            m_element: 0,
        };
        let mut default_id = 0u32;
        let mut size = 4u32;
        unsafe {
            let _ = AudioObjectGetPropertyData(
                1,
                &default_addr,
                0,
                ptr::null(),
                &mut size,
                &mut default_id as *mut _ as *mut _,
            );
        }

        let dev_addr = AudioObjectPropertyAddress {
            m_selector: u32::from_be_bytes(*b"dev#"),
            m_scope: u32::from_be_bytes(*b"glob"),
            m_element: 0,
        };
        let mut dev_size = 0u32;
        unsafe {
            if AudioObjectGetPropertyDataSize(1, &dev_addr, 0, ptr::null(), &mut dev_size) != 0 {
                return results;
            }
            let count = dev_size as usize / 4;
            let mut device_ids = vec![0u32; count];
            if AudioObjectGetPropertyData(
                1,
                &dev_addr,
                0,
                ptr::null(),
                &mut dev_size,
                device_ids.as_mut_ptr() as *mut _,
            ) != 0
            {
                return results;
            }

            for id in device_ids {
                let stm_addr = AudioObjectPropertyAddress {
                    m_selector: u32::from_be_bytes(*b"stm#"),
                    m_scope: u32::from_be_bytes(*b"outp"),
                    m_element: 0,
                };
                let mut stm_size = 0u32;
                if AudioObjectGetPropertyDataSize(id, &stm_addr, 0, ptr::null(), &mut stm_size) == 0
                    && stm_size > 0
                {
                    let name = get_cf_str(id, *b"lnam")
                        .unwrap_or_else(|| format!("Audio Device {}", id));
                    let uid = get_cf_str(id, *b"uid ").unwrap_or_else(|| id.to_string());
                    let mut tran = 0u32;
                    let mut tran_size = 4u32;
                    let tran_addr = AudioObjectPropertyAddress {
                        m_selector: u32::from_be_bytes(*b"tran"),
                        m_scope: u32::from_be_bytes(*b"glob"),
                        m_element: 0,
                    };
                    let transport = if AudioObjectGetPropertyData(
                        id,
                        &tran_addr,
                        0,
                        ptr::null(),
                        &mut tran_size,
                        &mut tran as *mut _ as *mut _,
                    ) == 0
                    {
                        match &tran.to_be_bytes() {
                            b"bltn" => "builtin",
                            b"blue" => "bluetooth",
                            b"usb " => "usb",
                            b"dspt" | b"hdmi" => "display",
                            b"airp" => "airplay",
                            _ => "other",
                        }
                    } else {
                        "other"
                    };

                    results.push(super::AudioOutputDevice {
                        id: uid,
                        name,
                        transport: transport.to_string(),
                        is_default: id == default_id,
                    });
                }
            }
        }

        results
    }
}

#[tauri::command]
pub fn get_audio_output_devices() -> Vec<AudioOutputDevice> {
    #[cfg(target_os = "macos")]
    {
        core_audio::list_output_devices()
    }
    #[cfg(not(target_os = "macos"))]
    {
        vec![AudioOutputDevice {
            id: "default".to_string(),
            name: "Default Audio Device".to_string(),
            transport: "system".to_string(),
            is_default: true,
        }]
    }
}
