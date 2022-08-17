use rand;
use rand_distr::{Distribution, Normal};

pub fn my_string() -> String {
    let normal = Normal::new(2.0, 3.0).unwrap();
    let v = normal.sample(&mut rand::thread_rng());
    return format!("{} is from an N(2,3) distribution", v);
}
