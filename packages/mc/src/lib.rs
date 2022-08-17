use wasm_bindgen::prelude::*;
use web_sys::console;
mod distribution;
use distribution::{monte_carlo, bandwidth};

// When the `wee_alloc` feature is enabled, this uses `wee_alloc` as the global
// allocator.
//
// If you don't want to use `wee_alloc`, you can safely delete this.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// This is like the `main` function, except for JavaScript.
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();

    console::log_1(&JsValue::from_str(&format!(
        "nrd(1,2,5): {}",
        bandwidth::nrd([1.0, 2.0, 5.0].to_vec())
    )));
    // Your code goes here!
    console::log_1(&JsValue::from_str(&monte_carlo::my_string()));

    Ok(())
}
