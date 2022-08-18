use wasm_bindgen::prelude::*;
use serde_wasm_bindgen;
mod distribution;
use distribution::monte_carlo;

// When the `wee_alloc` feature is enabled, this uses `wee_alloc` as the global
// allocator.
//
// If you don't want to use `wee_alloc`, you can safely delete this.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn sample_n(samples: Box<[f32]>, num_samples: i32) -> Vec<f32> {
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
    let samples_vec = Vec::from(samples);

    monte_carlo::sample_n(samples_vec, num_samples)
}

// #[wasm_bindgen]
// pub fn samples_to_continuous_pdf(samples: Box<[f64]>, bandwidth: f64) -> JsValue {
//    #[cfg(debug_assertions)]
//    console_error_panic_hook::set_once();
//
//    let samples_vec = Vec::from(samples);
//    let pdf = monte_carlo::samples_to_continuous_pdf(samples_vec, bandwidth);
//    serde_wasm_bindgen::to_value(&pdf).unwrap()
//}
